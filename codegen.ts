import { CodegenConfig } from '@graphql-codegen/cli';

// https://subql-staging.orai.io/
export const endpoint_gql = `https//ammv3-indexer.oraidex.io/`;
const config: CodegenConfig = {
  schema: endpoint_gql,
  documents: ['src/**/*.tsx'],
  // ignoreNoDocuments: true, // for better experience with the watcher
  generates: {
    './src/gql/': {
      preset: 'client',
      plugins: []
    }
  }
};

export default config;
