# Trial Issues API

Backend API server for the Trial Issue Log System - a clinical trial site visit issue tracking application.

## ✅ Features

- **Complete CRUD Operations** for issue management
- **Advanced Filtering** - search, filter by status/severity/site, pagination
- **Dashboard Analytics** - real-time counts by status and severity
- **CSV Import** - bulk import issues from CSV files
- **Input Validation** - comprehensive validation with detailed error messages
- **SQL Injection Prevention** - parameterized queries throughout
- **Serverless Ready** - can deploy to AWS Lambda or traditional servers
- **Comprehensive Test Suite** - 59 tests with 88%+ coverage

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (LTS)
- PostgreSQL 13+
- npm or yarn

### Database Setup

1. Ensure PostgreSQL is installed and running
2. Run the database setup script:

```bash
cd ../db
./setup.sh
```

This creates:

- Database: `espresso`
- User: `admin` (password: `admin`)
- Table: `issues` with all required fields and indexes

### Installation

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp env.example .env
```

3. Start the server:

```bash
npm start
```

The server will start on `http://localhost:3000`

### Development Mode

For development with hot reload:

```bash
npm run dev
```

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api/v1
```

### Endpoints

#### Health Check

```
GET /health
```

Returns server health status.

#### Issues

| Method | Endpoint              | Description                  |
| ------ | --------------------- | ---------------------------- |
| GET    | `/issues`             | List all issues with filters |
| GET    | `/issues/:id`         | Get single issue by ID       |
| POST   | `/issues`             | Create new issue             |
| PUT    | `/issues/:id`         | Update issue                 |
| DELETE | `/issues/:id`         | Delete issue                 |
| PATCH  | `/issues/:id/resolve` | Quick resolve issue          |

#### Dashboard

```
GET /dashboard
```

Returns aggregated counts by status and severity.

#### Import

```
POST /import/csv
```

Import issues from CSV file (multipart/form-data).

### Request/Response Examples

#### Create Issue

**Request:**

```bash
curl -X POST http://localhost:3000/api/v1/issues \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Missing consent form",
    "description": "Consent form not in file for patient 003",
    "site": "Site-101",
    "severity": "major",
    "status": "open"
  }'
```

**Response:**

```json
{
  "id": 1,
  "title": "Missing consent form",
  "description": "Consent form not in file for patient 003",
  "site": "Site-101",
  "severity": "major",
  "status": "open",
  "createdAt": "2025-10-25T10:30:00Z",
  "updatedAt": "2025-10-25T10:30:00Z"
}
```

#### List Issues with Filters

**Request:**

```bash
curl "http://localhost:3000/api/v1/issues?status=open&severity=major&sort=created_at&order=desc&page=1&limit=10"
```

**Query Parameters:**

- `search` - Text search in title
- `status` - Filter by status (open|in_progress|resolved)
- `severity` - Filter by severity (minor|major|critical)
- `site` - Filter by site
- `sort` - Sort field (created_at|updated_at|title|severity|status)
- `order` - Sort order (asc|desc)
- `page` - Page number (for pagination)
- `limit` - Items per page (max: 100)

#### Import CSV

**Request:**

```bash
curl -X POST http://localhost:3000/api/v1/import/csv \
  -F "file=@issues.csv"
```

**CSV Format:**

```csv
title,description,site,severity,status,createdAt
Missing consent form,Description here,Site-101,major,open,2025-05-01T09:00:00Z
```

## 🧪 Testing

### Run Tests

```bash
npm test
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Test Coverage

Current test coverage: **88%+**

- 59 comprehensive tests
- All API endpoints tested
- Validation testing
- Error handling testing
- CSV import testing
- SQL injection prevention testing

## 📁 Project Structure

```
api/
├── src/
│   ├── app.js              # Express app setup
│   ├── db/
│   │   └── connection.js   # Database connection pool
│   ├── models/
│   │   └── issue.js        # Issue model with database queries
│   ├── routes/
│   │   ├── issues.js       # Issues CRUD routes
│   │   ├── dashboard.js    # Dashboard analytics route
│   │   └── import.js       # CSV import route
│   ├── middleware/
│   │   ├── validation.js   # Request validation middleware
│   │   ├── errorHandler.js # Central error handling
│   │   └── notFoundHandler.js # 404 handler
├── tests/
│   ├── issues.test.js      # Issues API tests
│   ├── dashboard.test.js   # Dashboard API tests
│   ├── import.test.js      # CSV import tests
│   ├── health.test.js      # Health & error handling tests
│   └── helpers/            # Test utilities
├── server.js               # Server entry point
├── lambda.js               # Lambda handler (serverless)
├── package.json
├── jest.config.js          # Jest configuration
└── env.example             # Environment variables template
```

## 🔧 Environment Variables

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://admin:admin@localhost:5432/espresso
CORS_ORIGIN=http://localhost:5173
MAX_FILE_SIZE=5mb
```

## 🚀 Deployment Options

This API is designed to work in multiple environments:

### Local/On-Premise

Default setup - runs on any server with Node.js and PostgreSQL.

### AWS Lambda (Serverless)

Uses `lambda.js` handler with `serverless-http` wrapper:

```bash
npm install serverless-http
serverless deploy
```

### Traditional Server (EC2, Heroku, etc.)

Uses `server.js` entry point:

```bash
NODE_ENV=production npm start
```

### Docker

Dockerfile included for containerized deployment.

## 🛡️ Security Features

- **Input Validation** - All inputs validated with express-validator
- **SQL Injection Prevention** - Parameterized queries throughout
- **CORS Configuration** - Configurable CORS origins
- **File Upload Validation** - CSV only, size limits
- **Error Message Sanitization** - No sensitive data in production errors
- **Rate Limiting Ready** - Can add rate limiting middleware

## 📊 Database Schema

```sql
CREATE TABLE issues (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    site VARCHAR(100) NOT NULL,
    severity ENUM ('minor', 'major', 'critical') NOT NULL,
    status ENUM ('open', 'in_progress', 'resolved') NOT NULL DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes

- Status, severity, site, created_at for filtering
- Full-text search index on title

## 🔄 API Response Format

### Success Response

```json
{
  "id": 1,
  "title": "Issue Title",
  "description": "Issue Description",
  "site": "Site-101",
  "severity": "major",
  "status": "open",
  "createdAt": "2025-10-25T10:30:00Z",
  "updatedAt": "2025-10-25T10:30:00Z"
}
```

### Error Response

```json
{
  "error": "Validation Error",
  "message": "Invalid input data",
  "details": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```

## 📝 License

ISC

## 👥 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🐛 Known Issues

None currently reported.

## 📞 Support

For issues or questions, please open an issue in the repository.
