import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { Link } from 'ot-ui';
import { betaClient } from '../../../client';
import { DataTable } from '../../../components/Table';
import ScientificNotation from '../../../components/ScientificNotation';
import Description from './Description';
import {
  identifiersOrgLink,
  sentenceCase,
  formatComma,
} from '../../../utils/global';
import {
  defaultRowsPerPageOptions,
  naLabel,
  decimalPlaces,
} from '../../../constants';
import SectionItem from '../../../components/Section/SectionItem';
import Summary from './Summary';
import usePlatformApi from '../../../hooks/usePlatformApi';

const PHEWAS_CATALOG_QUERY = gql`
  query PhewasCatalogQuery($ensemblId: String!, $efoId: String!, $size: Int!) {
    disease(efoId: $efoId) {
      id
      evidences(
        ensemblIds: [$ensemblId]
        enableIndirect: true
        datasourceIds: ["phewas_catalog"]
        size: $size
      ) {
        rows {
          disease {
            id
            name
          }
          diseaseFromSource
          variantRsId
          variantFunctionalConsequence {
            id
            label
          }
          resourceScore
          studyCases
          oddsRatio
        }
      }
    }
  }
`;

const columns = [
  {
    id: 'disease.name',
    label: 'Disease/phenotype',
    renderCell: ({ disease }) => {
      return <Link to={`/disease/${disease.id}`}>{disease.name}</Link>;
    },
  },
  {
    id: 'diseaseFromSource',
    label: 'Reported disease/phenotype [Phecode]',
  },
  {
    id: 'variantRsId',
    label: 'Variant',
    renderCell: ({ variantRsId }) => {
      return (
        <Link external to={identifiersOrgLink('DBSNP', variantRsId, 'ncbi')}>
          {variantRsId}
        </Link>
      );
    },
  },
  {
    id: 'variantFunctionalConsequence',
    label: 'Functional Consequence',
    renderCell: ({ variantFunctionalConsequence }) =>
      variantFunctionalConsequence ? (
        <Link
          external
          to={identifiersOrgLink(
            'SO',
            variantFunctionalConsequence.id.slice(3)
          )}
        >
          {sentenceCase(variantFunctionalConsequence.label)}
        </Link>
      ) : (
        naLabel
      ),
    filterValue: ({ variantFunctionalConsequence }) =>
      variantFunctionalConsequence.label,
  },
  {
    id: 'studyCases',
    label: 'Cases',
    renderCell: ({ studyCases }) => formatComma(studyCases),
    sortable: true,
  },
  {
    id: 'oddsRatio',
    label: 'Odds ratio',
    renderCell: ({ oddsRatio }) => oddsRatio.toFixed(decimalPlaces),
    sortable: true,
  },
  {
    id: 'resourceScore',
    label: 'P-value',
    renderCell: ({ resourceScore }) => (
      <ScientificNotation number={resourceScore} />
    ),
    sortable: true,
  },
];

function Body({ definition, id, label }) {
  const { ensgId: ensemblId, efoId } = id;
  const { data: summaryData } = usePlatformApi(
    Summary.fragments.PheWASCatalogSummary
  );

  const request = useQuery(PHEWAS_CATALOG_QUERY, {
    variables: {
      ensemblId,
      efoId,
      size: summaryData.phewasCatalogSummary.count,
    },
    client: betaClient,
  });

  return (
    <SectionItem
      definition={definition}
      request={request}
      renderDescription={() => (
        <Description symbol={label.symbol} diseaseName={label.name} />
      )}
      renderBody={({ disease }) => {
        const { rows } = disease.evidences;
        return (
          <DataTable
            columns={columns}
            rows={rows}
            dataDownloader
            showGlobalFilter
            rowsPerPageOptions={defaultRowsPerPageOptions}
            sortBy="resourceScore"
            order="asc"
          />
        );
      }}
    />
  );
}

export default Body;