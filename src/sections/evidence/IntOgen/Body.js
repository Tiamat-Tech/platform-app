import React from 'react';
import { Box, makeStyles, Typography } from '@material-ui/core';
import { useQuery } from '@apollo/client';
import { loader } from 'graphql.macro';

import { Link } from 'ot-ui';

import { betaClient } from '../../../client';
import ChipList from '../../../components/ChipList';
import { DataTable } from '../../../components/Table';
import { defaultRowsPerPageOptions, naLabel } from '../../../constants';
import Description from './Description';
import { epmcUrl } from '../../../utils/urls';
import methods from './methods';
import ScientificNotation from '../../../components/ScientificNotation';
import SectionItem from '../../../components/Section/SectionItem';
import usePlatformApi from '../../../hooks/usePlatformApi';
import Summary from './Summary';

const intOgenUrl = (id, approvedSymbol) =>
  `https://www.intogen.org/search?gene=${approvedSymbol}&cohort=${id}`;

const INTOGEN_QUERY = loader('./sectionQuery.gql');

const columns = [
  {
    id: 'disease',
    renderCell: ({ disease }) => (
      <Link to={`/disease/${disease.id}`}>{disease.name}</Link>
    ),
    filterValue: ({ disease }) => disease.name,
  },
  {
    id: 'numberMutatedSamples',
    label: 'Mutated / Total samples',
    propertyPath: 'variations.numberMutatedSamples',
    numeric: true,
    renderCell: ({
      variations: { 0: { numberMutatedSamples, numberSamplesTested } = {} },
    }) =>
      numberMutatedSamples && numberSamplesTested ? (
        <>
          {numberMutatedSamples}/{numberSamplesTested}
        </>
      ) : (
        naLabel
      ),
  },
  {
    id: 'resourceScore',
    label: (
      <>
        Combined <i>p</i>-value
      </>
    ),
    tooltip: (
      <>
        Visit the{' '}
        <Link external to="https://www.intogen.org/faq">
          IntOGen FAQ
        </Link>{' '}
        for more information.
      </>
    ),
    numeric: true,
    sortable: true,
    renderCell: ({ resourceScore }) => (
      <ScientificNotation number={resourceScore} />
    ),
  },
  {
    id: 'significantDriverMethods',
    label: 'Cancer driver methods',
    tooltip: (
      <>
        The current version of the intOGen pipeline uses seven methods to
        identify cancer driver genes from somatic point mutations - HotMAPS,
        dNDScv, smRegions, CBaSE, FML, MutPanning, and CLUSTL. The pipeline also
        uses a combination of methods. For further information on the methods,
        please{' '}
        <Link to={methods.columnTooltip.url} external>
          click here
        </Link>{' '}
        visit the intOGen FAQ.
      </>
    ),
    renderCell: ({ significantDriverMethods }) =>
      significantDriverMethods ? (
        <ChipList
          items={significantDriverMethods.map((am, index) => ({
            label: am,
            tooltip: (methods[am] || {}).description,
          }))}
        />
      ) : (
        naLabel
      ),
    filterValue: ({ significantDriverMethods }) =>
      significantDriverMethods.map(am => am).join(),
  },
  {
    id: 'cohortShortName',
    label: 'Cohort Information',
    renderCell: ({
      cohortId,
      cohortShortName,
      cohortDescription,
      target: { approvedSymbol },
    }) =>
      cohortShortName && cohortDescription ? (
        <>
          <Link external to={intOgenUrl(cohortId, approvedSymbol)}>
            {cohortShortName}
          </Link>{' '}
          {cohortDescription}
        </>
      ) : (
        naLabel
      ),
    filterValue: ({ cohortShortName, cohortDescription }) =>
      `${cohortShortName} ${cohortDescription}`,
  },
];

const useStyles = makeStyles({
  roleInCancerBox: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  roleInCancerTitle: { marginRight: '.5rem' },
});

function Body({ definition, id: { ensgId, efoId }, label: { symbol, name } }) {
  const classes = useStyles();
  const {
    data: {
      intOgen: { count: size },
    },
  } = usePlatformApi(Summary.fragments.IntOgenSummaryFragment);

  const request = useQuery(INTOGEN_QUERY, {
    variables: { ensemblId: ensgId, efoId, size },
    client: betaClient,
  });

  return (
    <SectionItem
      definition={definition}
      request={request}
      renderDescription={() => <Description symbol={symbol} name={name} />}
      renderBody={({
        disease: {
          evidences: { rows },
        },
        target: {
          hallmarks: { attributes },
        },
      }) => {
        const roleInCancerItems = attributes
          .filter(attribute => attribute.name === 'role in cancer')
          .map(attribute => ({
            label: attribute.reference.description,
            url: epmcUrl(attribute.reference.pubmedId),
          }));

        return (
          <>
            <Box className={classes.roleInCancerBox}>
              <Typography className={classes.roleInCancerTitle}>
                <b>{symbol}</b> role in cancer:
              </Typography>
              <ChipList items={roleInCancerItems} />
            </Box>
            <DataTable
              columns={columns}
              dataDownloader
              dataDownloaderFileStem={`otgenetics-${ensgId}-${efoId}`}
              order="desc"
              rows={rows}
              sortBy="resourceScore"
              pageSize={10}
              rowsPerPageOptions={defaultRowsPerPageOptions}
              showGlobalFilter
            />
          </>
        );
      }}
    />
  );
}

export default Body;