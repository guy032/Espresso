import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../package.json';

const swaggerDefinition: swaggerJsdoc.OAS3Definition = {
  openapi: '3.0.0',
  info: {
    title: 'Trial Issues API',
    version,
    description: 'API for managing clinical trial site visit issues',
    contact: {
      name: 'API Support',
      email: 'api-support@example.com',
    },
    license: {
      name: 'ISC',
      url: 'https://opensource.org/licenses/ISC',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000/api/v1',
      description: 'Development server',
    },
    {
      url: 'https://api.example.com/api/v1',
      description: 'Production server',
    },
  ],
  tags: [
    {
      name: 'Issues',
      description: 'Issue management operations',
    },
    {
      name: 'Dashboard',
      description: 'Dashboard analytics operations',
    },
    {
      name: 'Import',
      description: 'Data import operations',
    },
    {
      name: 'Health',
      description: 'Health check operations',
    },
  ],
  components: {
    schemas: {
      Issue: {
        type: 'object',
        required: ['title', 'description', 'site', 'severity', 'status'],
        properties: {
          id: {
            type: 'integer',
            format: 'int64',
            description: 'Unique identifier for the issue',
            example: 1,
          },
          title: {
            type: 'string',
            maxLength: 255,
            description: 'Title of the issue',
            example: 'Missing consent form',
          },
          description: {
            type: 'string',
            description: 'Detailed description of the issue',
            example: 'Consent form not in file for patient 003',
          },
          site: {
            type: 'string',
            maxLength: 100,
            description: 'Site identifier',
            example: 'Site-101',
          },
          severity: {
            type: 'string',
            enum: ['minor', 'major', 'critical'],
            description: 'Severity level of the issue',
            example: 'major',
          },
          status: {
            type: 'string',
            enum: ['open', 'in_progress', 'resolved'],
            description: 'Current status of the issue',
            example: 'open',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Timestamp when the issue was created',
            example: '2025-10-25T10:30:00Z',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Timestamp when the issue was last updated',
            example: '2025-10-25T10:30:00Z',
          },
        },
      },
      IssueCreateInput: {
        type: 'object',
        required: ['title', 'description', 'site', 'severity'],
        properties: {
          title: {
            type: 'string',
            maxLength: 255,
            description: 'Title of the issue',
            example: 'Missing consent form',
          },
          description: {
            type: 'string',
            description: 'Detailed description of the issue',
            example: 'Consent form not in file for patient 003',
          },
          site: {
            type: 'string',
            maxLength: 100,
            description: 'Site identifier',
            example: 'Site-101',
          },
          severity: {
            type: 'string',
            enum: ['minor', 'major', 'critical'],
            description: 'Severity level of the issue',
            example: 'major',
          },
          status: {
            type: 'string',
            enum: ['open', 'in_progress', 'resolved'],
            description: 'Initial status of the issue',
            default: 'open',
            example: 'open',
          },
        },
      },
      IssueUpdateInput: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            maxLength: 255,
            description: 'Title of the issue',
            example: 'Updated issue title',
          },
          description: {
            type: 'string',
            description: 'Detailed description of the issue',
            example: 'Updated issue description',
          },
          site: {
            type: 'string',
            maxLength: 100,
            description: 'Site identifier',
            example: 'Site-202',
          },
          severity: {
            type: 'string',
            enum: ['minor', 'major', 'critical'],
            description: 'Severity level of the issue',
            example: 'critical',
          },
          status: {
            type: 'string',
            enum: ['open', 'in_progress', 'resolved'],
            description: 'Current status of the issue',
            example: 'in_progress',
          },
        },
      },
      DashboardCounts: {
        type: 'object',
        properties: {
          statusCounts: {
            type: 'object',
            properties: {
              open: {
                type: 'integer',
                example: 5,
              },
              in_progress: {
                type: 'integer',
                example: 3,
              },
              resolved: {
                type: 'integer',
                example: 12,
              },
            },
          },
          severityCounts: {
            type: 'object',
            properties: {
              minor: {
                type: 'integer',
                example: 8,
              },
              major: {
                type: 'integer',
                example: 7,
              },
              critical: {
                type: 'integer',
                example: 5,
              },
            },
          },
          totalIssues: {
            type: 'integer',
            example: 20,
          },
        },
      },
      ImportResult: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          message: {
            type: 'string',
            example: 'Successfully imported 4 issues',
          },
          imported: {
            type: 'integer',
            example: 4,
          },
          skipped: {
            type: 'integer',
            example: 0,
          },
          errors: {
            type: 'array',
            items: {
              type: 'string',
            },
            example: [],
          },
        },
      },
      ValidationError: {
        type: 'object',
        properties: {
          field: {
            type: 'string',
            description: 'Field that failed validation',
            example: 'title',
          },
          message: {
            type: 'string',
            description: 'Validation error message',
            example: 'Title is required',
          },
          value: {
            description: 'The invalid value provided',
            example: '',
          },
        },
      },
      ApiError: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error category',
            example: 'Validation Error',
          },
          message: {
            type: 'string',
            description: 'Error message',
            example: 'Invalid input data',
          },
          details: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/ValidationError',
            },
          },
          path: {
            type: 'string',
            description: 'Request path',
            example: '/api/v1/issues',
          },
          method: {
            type: 'string',
            description: 'HTTP method',
            example: 'POST',
          },
        },
      },
      HealthStatus: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['healthy', 'unhealthy'],
            example: 'healthy',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2025-10-25T10:30:00Z',
          },
          environment: {
            type: 'string',
            example: 'development',
          },
        },
      },
    },
    parameters: {
      issueId: {
        name: 'id',
        in: 'path',
        required: true,
        description: 'Issue ID',
        schema: {
          type: 'integer',
          format: 'int64',
        },
      },
      statusFilter: {
        name: 'status',
        in: 'query',
        description: 'Filter by status',
        schema: {
          type: 'string',
          enum: ['open', 'in_progress', 'resolved'],
        },
      },
      severityFilter: {
        name: 'severity',
        in: 'query',
        description: 'Filter by severity',
        schema: {
          type: 'string',
          enum: ['minor', 'major', 'critical'],
        },
      },
      siteFilter: {
        name: 'site',
        in: 'query',
        description: 'Filter by site',
        schema: {
          type: 'string',
        },
      },
      searchQuery: {
        name: 'search',
        in: 'query',
        description: 'Search in title (case-insensitive)',
        schema: {
          type: 'string',
        },
      },
      sortField: {
        name: 'sort',
        in: 'query',
        description: 'Sort field',
        schema: {
          type: 'string',
          enum: ['id', 'title', 'severity', 'status', 'createdAt', 'updatedAt'],
          default: 'createdAt',
        },
      },
      sortOrder: {
        name: 'order',
        in: 'query',
        description: 'Sort order',
        schema: {
          type: 'string',
          enum: ['asc', 'desc'],
          default: 'desc',
        },
      },
      pageNumber: {
        name: 'page',
        in: 'query',
        description: 'Page number (1-based)',
        schema: {
          type: 'integer',
          minimum: 1,
          default: 1,
        },
      },
      pageLimit: {
        name: 'limit',
        in: 'query',
        description: 'Items per page',
        schema: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 50,
        },
      },
    },
    responses: {
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ApiError',
            },
          },
        },
      },
      BadRequest: {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ApiError',
            },
          },
        },
      },
      InternalError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ApiError',
            },
          },
        },
      },
    },
  },
};

const options: swaggerJsdoc.Options = {
  definition: swaggerDefinition,
  apis: ['./src/routes/*.ts', './src/swagger/paths.ts'], // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options);
