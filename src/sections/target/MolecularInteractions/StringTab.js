import React, { Fragment, useState, useEffect } from 'react';
import Typography from '@material-ui/core/Typography';
import { loader } from 'graphql.macro';
import client from '../../../client';
import { withTheme, makeStyles, Link } from '@material-ui/core';

import DataTable from '../../../components/Table/DataTable';
import Legend from '../../../components/Legend';
import { colorRange } from '../../../constants';

import Grid from '@material-ui/core/Grid';

import * as d3 from 'd3';

const INTERACTIONS_QUERY = loader('./sectionStringQuery.gql');
const getData = (ensgId, sourceDatabase, index, size) => {
  return client.query({
    query: INTERACTIONS_QUERY,
    variables: {
      ensgId,
      sourceDatabase,
      index,
      size,
    },
  });
};

const useStyles = makeStyles({
  root: {
    overflow: 'visible',
    padding: '2rem 3rem 0 0',
  },
  table: {
    tableLayout: 'fixed',
  },
  sortLabel: {
    top: '8px',
  },
  innerLabel: {
    position: 'absolute',
    display: 'inline-block',
    transformOrigin: '-20px 20px',
    bottom: 0,
    transform: 'rotate(315deg)',
    marginBottom: '5px',
  },
  nameHeaderCell: {
    width: '15%',
    borderBottom: 0,
    height: '140px',
    verticalAlign: 'bottom',
    textAlign: 'end',
    paddingBottom: '.4rem',
  },
  headerCell: {
    position: 'relative',
    borderBottom: 0,
    height: '140px',
    whiteSpace: 'nowrap',
    textAlign: 'center',
    verticalAlign: 'bottom',
  },
  overallCell: {
    border: 0,
    textAlign: 'center',
    paddingTop: '1px',
    paddingBottom: '1px',
    paddingLeft: '1px',
    paddingRight: '10px',
  },
  cell: {
    border: 0,
    height: '20px',
    textAlign: 'center',
    padding: '1px 1px',
    '&:last-child': {
      paddingRight: 0,
    },
  },
  colorSpan: {
    display: 'block',
    height: '20px',
    border: '1px solid #eeefef',
  },
  nameCell: {
    border: 0,
    // width: '20%',
    padding: '0 0.5rem 0 0',
    '&:first-child': {
      paddingLeft: 0,
    },
  },
  nameContainer: {
    display: 'block',
    textAlign: 'end',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  },
});

function getColumns(classes) {
  return [
    {
      id: 'partner',
      label: (
        <>
          Interactor B
          {/* <br />
          <Typography variant="caption">Species (if not human)</Typography> */}
        </>
      ),
      classes: {
        headerCell: classes.nameHeaderCell,
        cell: classes.nameCell,
      },
      renderCell: row => (
        <span className={classes.nameContainer}>
          {row.targetB ? row.targetB.approvedSymbol : row.intB}
          {/* {row.organism.mnemonic.toLowerCase() !== 'human' ? (
            <>
              <br />
              <Typography variant="caption">
                Species: {row.organism.mnemonic}
              </Typography>
            </>
          ) : null} */}
        </span>
      ),
    },
    {
      id: 'overallScore',
      label: (
        <>
          Overall
          <br />
          interaction score
        </>
      ),
      classes: {
        headerCell: classes.headerCell,
        cell: classes.cell,
        sortLabel: classes.sortLabel,
        innerLabel: classes.innerLabel,
      },
      renderCell: row => getHeatmapCell(row.scoring, classes),
    },
    {
      id: 'neighbourhood',
      label: 'Neighbourhood',
      classes: {
        headerCell: classes.headerCell,
        cell: classes.cell,
        sortLabel: classes.sortLabel,
        innerLabel: classes.innerLabel,
      },
      renderCell: row =>
        getHeatmapCell(
          getScoreForColumn(row.evidences, 'gene neighbourhood'),
          classes
        ),
    },
    {
      id: 'geneFusion',
      label: 'Gene fusion',
      classes: {
        headerCell: classes.headerCell,
        cell: classes.cell,
        sortLabel: classes.sortLabel,
        innerLabel: classes.innerLabel,
      },
      renderCell: row =>
        getHeatmapCell(
          getScoreForColumn(row.evidences, 'domain fusion'),
          classes
        ),
    },
    {
      id: 'occurance',
      label: 'Co-occurrance',
      classes: {
        headerCell: classes.headerCell,
        cell: classes.cell,
        sortLabel: classes.sortLabel,
        innerLabel: classes.innerLabel,
      },
      renderCell: row =>
        getHeatmapCell(
          getScoreForColumn(row.evidences, 'cooccurence'),
          classes
        ),
    },
    {
      id: 'expression',
      label: 'Co-expression',
      classes: {
        headerCell: classes.headerCell,
        cell: classes.cell,
        sortLabel: classes.sortLabel,
        innerLabel: classes.innerLabel,
      },
      renderCell: row =>
        getHeatmapCell(
          getScoreForColumn(row.evidences, 'coexpression'),
          classes
        ),
    },
    {
      id: 'experiments',
      label: 'Experiments',
      classes: {
        headerCell: classes.headerCell,
        cell: classes.cell,
        sortLabel: classes.sortLabel,
        innerLabel: classes.innerLabel,
      },
      renderCell: row =>
        getHeatmapCell(
          getScoreForColumn(row.evidences, 'experimental'),
          classes
        ),
    },
    {
      id: 'databases',
      label: 'Databases',
      classes: {
        headerCell: classes.headerCell,
        cell: classes.cell,
        sortLabel: classes.sortLabel,
        innerLabel: classes.innerLabel,
      },
      renderCell: row =>
        getHeatmapCell(getScoreForColumn(row.evidences, 'database'), classes),
    },
    {
      id: 'textMining',
      label: 'Text mining',
      classes: {
        headerCell: classes.headerCell,
        cell: classes.cell,
        sortLabel: classes.sortLabel,
        innerLabel: classes.innerLabel,
      },
      renderCell: row =>
        getHeatmapCell(
          getScoreForColumn(row.evidences, 'text mining'),
          classes
        ),
    },
    {
      id: 'homology',
      label: 'Homology',
      classes: {
        headerCell: classes.headerCell,
        cell: classes.cell,
        sortLabel: classes.sortLabel,
        innerLabel: classes.innerLabel,
      },
      renderCell: row =>
        getHeatmapCell(
          getScoreForColumn(row.evidences, 'by homology'),
          classes
        ),
    },
  ];
}

const getScoreForColumn = (evidences, id) => {
  return evidences
    .filter(e => e.interactionDetectionMethodShortName === id)
    .map(e => e.evidenceScore)[0]; // TODO: the [0] is to catch a data error: remove when fixed.
};

const getHeatmapCell = (score, classes) => {
  return (
    <span
      className={classes.colorSpan}
      title={score || 'No data'}
      style={{ backgroundColor: color(score) }}
    />
  );
};

const id = 'string';
const index = 0;
const size = 5000;
const color = d3
  .scaleQuantize()
  .domain([0, 1])
  .range(colorRange);

function StringTab({ ensgId, symbol }) {
  const [data, setData] = useState([]);
  const classes = useStyles();
  const columns = getColumns(classes);

  // load tab data when new tab selected (also on first load)
  useEffect(
    () => {
      getData(ensgId, id, index, size).then(res => {
        if (res.data.target.interactions) {
          setData(res.data.target.interactions.rows);
        }
      });
    },
    [ensgId]
  );

  return (
    <Grid container spacing={4}>
      <Grid item xs={12}>
        {/* table 1: this is the only table and will need to be a HEATMAP */}
        <DataTable
          showGlobalFilter
          columns={columns}
          rows={data}
          dataDownloader
          dataDownloaderFileStem={`${symbol}-molecular-interactions-string`}
          fixed
          classes={{ root: classes.root, table: classes.table }}
        />
        <Legend />
      </Grid>
    </Grid>
  );
}

// export default StringTab;
export default withTheme(StringTab);