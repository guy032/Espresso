module.exports = {
  trialIssues: {
    input: {
      target: 'http://localhost:3000/api-docs.json',
    },
    output: {
      mode: 'tags-split',
      target: './src/api/generated',
      schemas: './src/api/generated/models',
      client: 'react-query',
      mock: false,
      prettier: true,
      override: {
        mutator: {
          path: './src/api/axios-instance.ts',
          name: 'customAxiosInstance',
        },
        query: {
          useQuery: true,
          useInfinite: true,
          useMutation: true,
          version: 5,
          options: {
            staleTime: 10000,
          },
        },
      },
    },
  },
};
