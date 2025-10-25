# OpenAPI Documentation

## 📚 API Documentation

The Trial Issues API provides comprehensive OpenAPI 3.0 documentation with interactive Swagger UI.

### Accessing Documentation

#### Interactive Swagger UI

- **URL**: http://localhost:3000/api-docs
- Browse and test all API endpoints interactively
- View request/response schemas
- Try out API calls directly from the browser

#### OpenAPI Specification

- **JSON**: http://localhost:3000/api-docs.json
- **YAML**: http://localhost:3000/api-docs.yaml

### Generating OpenAPI Files

Generate static OpenAPI specification files for use with client generators:

```bash
npm run generate:openapi
```

This creates:

- `openapi/openapi.json` - JSON format
- `openapi/openapi.yaml` - YAML format

## 🔧 Using with Orval

Orval can generate a fully typed TypeScript client from our OpenAPI spec.

### Installation

```bash
# Install Orval in your frontend project
npm install -D @orval/core
```

### Configuration

Create `orval.config.ts` in your frontend project:

```typescript
import { defineConfig } from '@orval/core';

export default defineConfig({
  trialIssuesApi: {
    input: {
      target: 'http://localhost:3000/api-docs.json',
      // Or use the generated file:
      // target: '../api/openapi/openapi.json',
    },
    output: {
      mode: 'split',
      target: './src/api/generated/trialIssues.ts',
      schemas: './src/api/generated/models',
      client: 'react-query', // or 'axios', 'swr', etc.
      override: {
        mutator: {
          path: './src/api/custom/axios-instance.ts',
          name: 'customAxiosInstance',
        },
      },
    },
    hooks: {
      afterAllFilesWrite: 'prettier --write',
    },
  },
});
```

### Generate Client

```bash
# In your frontend project
npx orval
```

### Example Usage

```typescript
// Frontend code using the generated client
import { useGetIssues, useCreateIssue } from './api/generated/trialIssues';
import { IssueCreateInput } from './api/generated/models';

function IssueList() {
  // Fully typed query hook
  const { data: issues, isLoading } = useGetIssues({
    status: 'open',
    severity: 'critical',
  });

  // Fully typed mutation hook
  const createMutation = useCreateIssue();

  const handleCreate = (issue: IssueCreateInput) => {
    createMutation.mutate({ data: issue });
  };

  // ...
}
```

## 🎯 Type Safety Benefits

With our comprehensive TypeScript types and OpenAPI spec:

1. **Backend Types**:
   - All API endpoints are fully typed
   - Database queries use specific types (no `any`)
   - Request/response validation is type-safe

2. **Frontend Types** (via Orval):
   - Auto-generated TypeScript interfaces
   - Type-safe API calls
   - IntelliSense support
   - Compile-time error checking

3. **Contract Validation**:
   - OpenAPI spec serves as single source of truth
   - Backend implementation matches spec
   - Frontend client matches spec
   - Breaking changes are caught at compile time

## 📋 Available Types

### Core Types

```typescript
interface Issue {
  id?: number;
  title: string;
  description: string;
  site: string;
  severity: 'minor' | 'major' | 'critical';
  status: 'open' | 'in_progress' | 'resolved';
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

interface DashboardCounts {
  statusCounts: {
    open: number;
    in_progress: number;
    resolved: number;
  };
  severityCounts: {
    minor: number;
    major: number;
    critical: number;
  };
  totalIssues: number;
}

interface QueryFilters {
  search?: string;
  status?: 'open' | 'in_progress' | 'resolved';
  severity?: 'minor' | 'major' | 'critical';
  site?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
```

### Database Types

```typescript
type QueryParam = string | number | boolean | Date | null | undefined;

interface IssueRow extends QueryResultRow {
  id: number;
  title: string;
  description: string;
  site: string;
  severity: 'minor' | 'major' | 'critical';
  status: 'open' | 'in_progress' | 'resolved';
  created_at: Date;
  updated_at: Date;
}
```

## 🛠️ Other Client Generators

The OpenAPI spec can be used with various tools:

### OpenAPI Generator

```bash
# Generate TypeScript Axios client
npx @openapitools/openapi-generator-cli generate \
  -i http://localhost:3000/api-docs.json \
  -g typescript-axios \
  -o ./src/api/generated
```

### Swagger Codegen

```bash
swagger-codegen generate \
  -i http://localhost:3000/api-docs.json \
  -l typescript-fetch \
  -o ./src/api/generated
```

### Postman Import

1. Open Postman
2. Click Import → Link
3. Enter: `http://localhost:3000/api-docs.json`
4. Postman creates a collection with all endpoints

### Insomnia Import

1. Open Insomnia
2. Create New → Import from URL
3. Enter: `http://localhost:3000/api-docs.yaml`

## 🔍 API Endpoints Summary

| Method | Endpoint                     | Description         |
| ------ | ---------------------------- | ------------------- |
| GET    | `/health`                    | Health check        |
| GET    | `/api-docs`                  | Swagger UI          |
| GET    | `/api-docs.json`             | OpenAPI JSON        |
| GET    | `/api-docs.yaml`             | OpenAPI YAML        |
|        |                              |                     |
| GET    | `/api/v1/issues`             | List all issues     |
| GET    | `/api/v1/issues/:id`         | Get issue by ID     |
| POST   | `/api/v1/issues`             | Create new issue    |
| PUT    | `/api/v1/issues/:id`         | Update issue        |
| DELETE | `/api/v1/issues/:id`         | Delete issue        |
| PATCH  | `/api/v1/issues/:id/resolve` | Resolve issue       |
|        |                              |                     |
| GET    | `/api/v1/dashboard`          | Get dashboard stats |
| POST   | `/api/v1/import/csv`         | Import CSV file     |

## 📝 Development Notes

### Adding New Endpoints

1. Create route handler with proper types
2. Add JSDoc comments in `src/swagger/paths.ts`
3. Regenerate OpenAPI spec: `npm run generate:openapi`
4. Regenerate client: `npx orval`

### Updating Types

1. Update interfaces in `src/types/index.ts`
2. Update OpenAPI schemas in `src/swagger/config.ts`
3. Regenerate spec and client

### Validation

All endpoints use `express-validator` with type-safe validation rules that match the OpenAPI spec.
