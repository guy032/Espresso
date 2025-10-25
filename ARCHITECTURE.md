# Trial Issue Log - Architecture Proposal

## Executive Summary

This architecture is designed to be **local-first, cloud-optional** with support for:

✅ **Local/On-Prem Development** (Recommended Start)

- Run entire stack with `docker-compose up`
- Zero cloud costs, works offline
- Perfect for development and on-prem production

✅ **AWS Serverless Deployment** (Optional)

- Lambda + API Gateway for backend
- Auto-scaling, pay-per-use pricing
- Ideal for variable traffic patterns

✅ **AWS Traditional Deployment** (Optional)

- EC2 + RDS for predictable performance
- No cold starts, easier debugging
- Simpler operations

**Key Feature:** The same codebase works in all three environments with minimal configuration changes.

## Overview

This document outlines the proposed architecture for the Trial Issue Log system, a full-stack application for tracking clinical trial site visit issues. The architecture prioritizes getting a working system running locally first, with optional cloud deployment later.

## Technology Stack

### Backend

**Framework: Express.js**

- **Why Express?**
  - Lightweight and minimalist, perfect for a 3-5 hour time-boxed project
  - Extensive ecosystem and middleware support
  - Easy to understand and maintain
  - Fast development cycle
  - Well-documented and widely adopted

**Database: PostgreSQL on AWS RDS**

- **For this assignment:**

  - Structured data with well-defined schema (issues with specific fields)
  - ACID compliance important for clinical trial data integrity
  - Excellent support for enum types (status, severity)
  - Free tier available on AWS RDS
  - Easy to set up and deploy

- **For production scale:**
  - PostgreSQL offers strong consistency guarantees (critical for clinical data)
  - Robust indexing for fast queries and filters
  - Supports complex queries if we need to add analytics
  - Excellent backup and recovery options
  - Can scale vertically easily, horizontally with read replicas
  - Mature ecosystem for monitoring and maintenance

**Alternative Considered:** MongoDB

- Pros: Faster initial setup, flexible schema
- Cons: Less suitable for structured clinical data, ACID compliance requires more configuration

### Frontend

**Framework: React with Vite**

- **Why React + Vite?**
  - React is industry standard with massive community support
  - Vite provides blazing fast HMR and build times (important for time-boxed development)
  - Component-based architecture perfect for reusable UI elements (issue cards, filters, forms)
  - Easy to deploy as static files to S3 + CloudFront

**UI Library: Tailwind CSS**

- Utility-first approach enables rapid UI development
- No need to context-switch between JS and CSS files
- Built-in responsive design utilities
- Small bundle size when purged

**State Management: React Context + Hooks**

- Sufficient for this scale of application
- No need for Redux/MobX overhead
- Native to React, zero dependencies

**For production scale:**

- Consider adding React Query for server state management and caching
- May add Redux Toolkit if state complexity grows significantly
- TypeScript for type safety (already beneficial for assignment)

### Infrastructure Options

#### Option 1: Local/On-Prem First (Recommended for Development)

```
┌─────────────────────────────────────────────────┐
│              Local Machine / On-Prem            │
│                                                 │
│  ┌──────────────────────────────────────┐      │
│  │      Docker Compose Stack            │      │
│  │                                      │      │
│  │  ┌────────────────┐                 │      │
│  │  │   Frontend     │                 │      │
│  │  │  (Vite Dev/    │                 │      │
│  │  │   Nginx Prod)  │                 │      │
│  │  │  Port: 5173    │                 │      │
│  │  └────────┬───────┘                 │      │
│  │           │                         │      │
│  │  ┌────────▼───────┐                 │      │
│  │  │   Backend API  │                 │      │
│  │  │  (Express.js)  │                 │      │
│  │  │  Port: 3000    │                 │      │
│  │  └────────┬───────┘                 │      │
│  │           │                         │      │
│  │  ┌────────▼───────┐                 │      │
│  │  │   PostgreSQL   │                 │      │
│  │  │  Port: 5432    │                 │      │
│  │  └────────────────┘                 │      │
│  │                                      │      │
│  └──────────────────────────────────────┘      │
└─────────────────────────────────────────────────┘
```

**Why Local First:**

- Zero cloud costs during development
- Fast iteration with hot reload
- Easy debugging and testing
- Works offline
- Simple setup with Docker Compose
- Can be deployed on-prem for organizations with data residency requirements

**Components:**

- **Docker Compose** orchestrates all services
- **PostgreSQL** container with persistent volume
- **Express API** with nodemon for hot reload
- **React + Vite** dev server or Nginx for production build
- **Volumes** for database persistence and code mounting

#### Option 2: AWS Serverless (Cloud Optional)

```
┌─────────────────────────────────────────────────────────────┐
│                         AWS Cloud                            │
│                                                              │
│  ┌────────────────┐      ┌──────────────────┐              │
│  │   CloudFront   │      │   API Gateway    │              │
│  │   (CDN)        │      │   (REST API)     │              │
│  └────────┬───────┘      └────────┬─────────┘              │
│           │                       │                         │
│  ┌────────▼───────┐      ┌────────▼─────────┐              │
│  │   S3 Bucket    │      │  Lambda Functions│              │
│  │  (Frontend)    │      │  (Node.js 20.x)  │              │
│  └────────────────┘      └────────┬─────────┘              │
│                                   │                         │
│                          ┌────────▼─────────┐              │
│                          │  RDS PostgreSQL  │              │
│                          │  (db.t3.micro)   │              │
│                          │  OR              │              │
│                          │  Aurora Serverless│              │
│                          └──────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

**Serverless Benefits:**

- Pay only for what you use (cost-effective for low traffic)
- Auto-scaling built-in
- No server management
- High availability by default

**Serverless Considerations:**

- Cold starts (300-1000ms initial latency)
- Connection pooling complexity with RDS
- 15-minute Lambda timeout limit
- Debugging can be more complex

#### Option 3: AWS Traditional (EC2)

```
┌─────────────────────────────────────────────────────────────┐
│                         AWS Cloud                            │
│                                                              │
│  ┌────────────────┐      ┌──────────────────┐              │
│  │   CloudFront   │      │  Application     │              │
│  │   (CDN)        │      │  Load Balancer   │              │
│  └────────┬───────┘      └────────┬─────────┘              │
│           │                       │                         │
│  ┌────────▼───────┐      ┌────────▼─────────┐              │
│  │   S3 Bucket    │      │  EC2 t2.micro    │              │
│  │  (Frontend)    │      │  (Backend API)   │              │
│  └────────────────┘      └────────┬─────────┘              │
│                                   │                         │
│                          ┌────────▼─────────┐              │
│                          │   RDS Postgres   │              │
│                          │   (db.t3.micro)  │              │
│                          └──────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

**Traditional Benefits:**

- Simpler architecture
- Predictable performance (no cold starts)
- Full control over environment
- Easier debugging

**Free Tier:**

- EC2: 750 hours/month (t2.micro)
- RDS: 750 hours/month (db.t3.micro, 20GB storage)
- S3: 5GB storage
- CloudFront: 50GB data transfer

## System Architecture

### High-Level Flow

```
User Browser
    │
    ├─→ [Frontend (React)]
    │       │
    │       ├─→ Display Issues List
    │       ├─→ Show Dashboard
    │       └─→ Render Forms
    │
    └─→ [Backend API (Express)]
            │
            ├─→ /api/issues (CRUD)
            ├─→ /api/dashboard (Analytics)
            ├─→ /api/import (CSV Upload)
            │
            └─→ [Database (PostgreSQL)]
                    │
                    └─→ issues table
```

## Database Schema

### Issues Table

```sql
CREATE TYPE severity_enum AS ENUM ('minor', 'major', 'critical');
CREATE TYPE status_enum AS ENUM ('open', 'in_progress', 'resolved');

CREATE TABLE issues (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    site VARCHAR(100) NOT NULL,
    severity severity_enum NOT NULL,
    status status_enum NOT NULL DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_severity ON issues(severity);
CREATE INDEX idx_issues_created_at ON issues(created_at DESC);
CREATE INDEX idx_issues_site ON issues(site);
CREATE INDEX idx_issues_title_search ON issues USING GIN(to_tsvector('english', title));
```

**Considerations:**

- `SERIAL` for auto-incrementing ID (simple and sufficient)
- ENUMs for status and severity (type safety at DB level)
- Indexes on commonly filtered/sorted columns
- Full-text search index on title for search functionality
- Timestamps with timezone for global trial coordination

**For Production:**

- Add `deleted_at` for soft deletes (audit trail)
- Add `created_by`, `updated_by` fields (user tracking)
- Add `site_id` foreign key if we normalize sites into separate table
- Consider partitioning by date if data volume grows significantly
- Add audit log table for compliance

## API Design

### RESTful Endpoints

```
BASE_URL: /api/v1
```

#### Issues CRUD

```
GET    /issues              - List all issues with filters
GET    /issues/:id          - Get single issue
POST   /issues              - Create new issue
PUT    /issues/:id          - Update issue
DELETE /issues/:id          - Delete issue
PATCH  /issues/:id/resolve  - Quick resolve (set status to resolved)
```

**Query Parameters for GET /issues:**

```
?search=<text>       - Search in title (case-insensitive)
?status=<status>     - Filter by status (open|in_progress|resolved)
?severity=<severity> - Filter by severity (minor|major|critical)
?site=<site>         - Filter by site
?sort=<field>        - Sort field (default: created_at)
?order=<asc|desc>    - Sort order (default: desc)
?page=<number>       - Page number (optional, for pagination)
?limit=<number>      - Items per page (optional, default: 50)
```

#### Dashboard

```
GET    /dashboard           - Get aggregated counts
```

**Response:**

```json
{
  "statusCounts": {
    "open": 5,
    "in_progress": 3,
    "resolved": 12
  },
  "severityCounts": {
    "minor": 8,
    "major": 7,
    "critical": 5
  },
  "totalIssues": 20
}
```

#### Import

```
POST   /import/csv          - Upload CSV file
```

**Request:** `multipart/form-data` with file field

### Request/Response Examples

**Create Issue:**

```json
POST /api/v1/issues
{
  "title": "Missing consent form",
  "description": "Consent form not in file for patient 003",
  "site": "Site-101",
  "severity": "major",
  "status": "open"
}

Response: 201 Created
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

**Error Response:**

```json
400 Bad Request
{
  "error": "Validation Error",
  "message": "Title is required",
  "details": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```

## Frontend Architecture

### Component Structure

```
src/
├── components/
│   ├── IssueForm.jsx          - Create/Edit issue form
│   ├── IssueList.jsx          - Issues table with filters
│   ├── IssueCard.jsx          - Single issue row/card
│   ├── Dashboard.jsx          - Dashboard with counts
│   ├── Filters.jsx            - Search and filter controls
│   ├── ImportCSV.jsx          - CSV upload component
│   └── Layout.jsx             - Main layout wrapper
│
├── pages/
│   ├── HomePage.jsx           - Main issues page
│   └── DashboardPage.jsx      - Dashboard page
│
├── services/
│   └── api.js                 - API client (axios/fetch)
│
├── hooks/
│   ├── useIssues.js           - Issues data fetching
│   └── useDashboard.js        - Dashboard data fetching
│
├── utils/
│   ├── validation.js          - Form validation
│   └── constants.js           - Enums, constants
│
├── App.jsx                    - Root component
└── main.jsx                   - Entry point
```

### State Management Strategy

**Local Component State:**

- Form inputs
- Modal visibility
- Loading states

**Context (Global State):**

- Issues list
- Filter state
- Dashboard data

**Server State:**

- Managed through custom hooks
- Simple caching strategy (refetch on actions)

## Local Development Setup (Recommended Start)

### Quick Start with Docker Compose

```yaml
# docker-compose.yml
version: "3.8"

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: espresso
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./api/db/schema.sql:/docker-entrypoint-initdb.d/schema.sql

  api:
    build: ./api
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://dev:dev123@postgres:5432/espresso
      NODE_ENV: development
    volumes:
      - ./api:/app
      - /app/node_modules
    depends_on:
      - postgres
    command: npm run dev

  frontend:
    build: ./app
    ports:
      - "5173:5173"
    environment:
      VITE_API_BASE_URL: http://localhost:3000/api/v1
    volumes:
      - ./app:/app
      - /app/node_modules
    command: npm run dev

volumes:
  postgres_data:
```

**Benefits:**

- Single command: `docker-compose up`
- Consistent environment for all developers
- No manual PostgreSQL installation needed
- Easy to reset database: `docker-compose down -v`
- Production-like environment locally

### Alternative: Local Setup Without Docker

```bash
# 1. Install PostgreSQL
brew install postgresql  # macOS
# or apt-get install postgresql  # Linux

# 2. Start PostgreSQL and create database
createdb espresso
psql espresso < api/db/schema.sql

# 3. Install backend dependencies and run
cd api
npm install
cp .env.example .env
npm run dev  # Runs on port 3000

# 4. Install frontend dependencies and run
cd ../app
npm install
npm run dev  # Runs on port 5173
```

## Code Structure for Serverless + Traditional Compatibility

### Backend Design Pattern

The Express app should be structured to work in **both serverless (Lambda) and traditional (EC2) environments**:

```javascript
// api/src/app.js - Pure Express app (no server)
const express = require("express");
const routes = require("./routes");

function createApp() {
  const app = express();

  app.use(express.json());
  app.use("/api/v1", routes);

  return app;
}

module.exports = { createApp };
```

```javascript
// api/server.js - Traditional server (EC2/local)
const { createApp } = require("./src/app");

const app = createApp();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

```javascript
// api/lambda.js - Serverless handler (Lambda)
const serverless = require("serverless-http");
const { createApp } = require("./src/app");

const app = createApp();
module.exports.handler = serverless(app);
```

**Key Pattern:**

- Core logic in `app.js` (framework-agnostic)
- `server.js` for traditional deployment
- `lambda.js` for serverless deployment
- Share the same codebase, routes, and business logic

### Database Connection Management

Different strategies for serverless vs traditional:

```javascript
// api/src/db/connection.js
const { Pool } = require("pg");

// Traditional: Long-lived connection pool
const traditionalPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Serverless: Minimal connections, reuse across invocations
const serverlessPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 2, // Lambda concurrency = connections
  idleTimeoutMillis: 0,
  connectionTimeoutMillis: 2000,
});

const pool = process.env.AWS_LAMBDA_FUNCTION_NAME
  ? serverlessPool
  : traditionalPool;

module.exports = { pool };
```

**For Production Serverless:**

- Consider RDS Proxy (connection pooling for Lambda)
- Or use Aurora Serverless (built-in connection management)

### Switching Between Deployment Modes

The architecture supports seamless switching:

**Running Locally:**

```bash
# Using Docker Compose
docker-compose up

# Or without Docker
npm run dev  # in both api/ and app/ directories
```

**Deploying as Traditional Server:**

```bash
# On EC2 or any server
node server.js  # Uses traditional connection pool
```

**Deploying as Serverless:**

```bash
# Deploy to Lambda
serverless deploy  # Uses lambda.js handler with serverless pool
```

**Key Differences:**
| Aspect | Local/Traditional | Serverless |
|--------|-------------------|------------|
| Entry Point | `server.js` | `lambda.js` |
| DB Connection Pool | Max 20 connections | Max 2 connections |
| Server Lifecycle | Long-running | Request-based |
| Environment Detection | `NODE_ENV !== 'production'` | `AWS_LAMBDA_FUNCTION_NAME` exists |

## Deployment Strategy

### Development → Production Pipeline

```
1. Development (Local First)
   ├─→ Docker Compose (all services)
   │   OR
   └─→ Local PostgreSQL + Node + Vite dev servers

2. Testing
   └─→ Run tests against local environment

3. Build
   ├─→ Backend: npm install --production (or bundle for Lambda)
   └─→ Frontend: npm run build (Vite)

4. Deploy (Optional)
   ├─→ Option A: Keep it local/on-prem
   ├─→ Option B: Deploy to AWS Serverless (Lambda)
   └─→ Option C: Deploy to AWS Traditional (EC2)
```

### Deployment Steps

#### Option A: Keep It Local/On-Prem (Recommended First)

```bash
# 1. Clone repository
git clone <repo-url>
cd trial-issues

# 2. Start everything with Docker Compose
docker-compose up -d

# 3. Access application
# Frontend: http://localhost:5173
# API: http://localhost:3000
# Database: localhost:5432

# 4. Stop services
docker-compose down

# 5. Reset database (if needed)
docker-compose down -v && docker-compose up -d
```

**For On-Prem Production:**

```bash
# Use production docker-compose
docker-compose -f docker-compose.prod.yml up -d

# Or deploy to internal server
# - Copy files to server
# - Run docker-compose on server
# - Configure reverse proxy (Nginx/Traefik)
# - Set up SSL certificates (Let's Encrypt)
```

#### Option B: AWS Serverless Deployment

**Prerequisites:**

```bash
npm install -g serverless
# or use AWS SAM CLI
```

**1. Create serverless.yml**

```yaml
service: trial-issues-api

provider:
  name: aws
  runtime: nodejs20.x
  region: us-east-1
  environment:
    DATABASE_URL: ${env:DATABASE_URL}

functions:
  api:
    handler: lambda.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true
```

**2. Deploy Backend**

```bash
cd api

# Install serverless-http
npm install serverless-http

# Deploy to Lambda
serverless deploy

# Or using AWS SAM
sam build
sam deploy --guided
```

**3. Setup Database (RDS or Aurora Serverless)**

```bash
# Option 1: RDS (if you need persistence)
aws rds create-db-instance \
  --db-instance-identifier trial-issues-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password [secure-password] \
  --allocated-storage 20

# Option 2: Aurora Serverless v2 (better for Lambda)
aws rds create-db-cluster \
  --db-cluster-identifier trial-issues-cluster \
  --engine aurora-postgresql \
  --engine-mode provisioned \
  --serverless-v2-scaling-configuration MinCapacity=0.5,MaxCapacity=1

# Run schema
psql $DATABASE_URL < db/schema.sql
```

**4. Deploy Frontend**

```bash
cd app
npm run build

# Deploy to S3
aws s3 mb s3://trial-issues-frontend-[unique-id]
aws s3 sync dist/ s3://trial-issues-frontend-[unique-id]
aws s3 website s3://trial-issues-frontend-[unique-id] \
  --index-document index.html

# Create CloudFront distribution (optional)
aws cloudfront create-distribution \
  --origin-domain-name trial-issues-frontend-[unique-id].s3.amazonaws.com
```

**Serverless Framework Alternative (Recommended):**

```yaml
# serverless.yml (complete setup)
service: trial-issues

provider:
  name: aws
  runtime: nodejs20.x
  region: us-east-1
  vpc:
    securityGroupIds:
      - ${env:SECURITY_GROUP_ID}
    subnetIds:
      - ${env:SUBNET_ID_1}
      - ${env:SUBNET_ID_2}

functions:
  api:
    handler: lambda.handler
    events:
      - httpApi: "*"
    environment:
      DATABASE_URL: ${env:DATABASE_URL}

resources:
  Resources:
    # S3 bucket for frontend
    FrontendBucket:
      Type: AWS::S3::Bucket
      Properties:
        BucketName: trial-issues-frontend-${self:provider.stage}
        WebsiteConfiguration:
          IndexDocument: index.html
```

```bash
# Single command deploy
serverless deploy
```

#### Option C: AWS Traditional (EC2) Deployment

**1. Database (RDS)**

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier trial-issues-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password [secure-password] \
  --allocated-storage 20

# Wait for availability
aws rds wait db-instance-available --db-instance-identifier trial-issues-db

# Get endpoint
aws rds describe-db-instances \
  --db-instance-identifier trial-issues-db \
  --query 'DBInstances[0].Endpoint.Address'

# Initialize schema
psql -h <rds-endpoint> -U admin -d espresso < api/db/schema.sql
```

**2. Backend (EC2)**

```bash
# Launch EC2 instance (via Console or CLI)
aws ec2 run-instances \
  --image-id ami-xxxxxxxxx \
  --instance-type t2.micro \
  --key-name your-key \
  --security-group-ids sg-xxxxxxxx

# SSH into EC2
ssh -i key.pem ec2-user@<ec2-public-ip>

# Install Node.js and dependencies
sudo yum update -y
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install --lts
npm install -g pm2

# Clone and setup application
git clone <repo-url>
cd trial-issues/api
npm install --production

# Configure environment
cat > .env << EOF
DATABASE_URL=postgresql://admin:password@rds-endpoint:5432/espresso
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://d123456.cloudfront.net
EOF

# Start with PM2
pm2 start server.js --name trial-api
pm2 startup systemd
pm2 save

# Optional: Setup Nginx as reverse proxy
sudo yum install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

**3. Frontend (S3 + CloudFront)**

```bash
# Build frontend
cd app
npm run build

# Create S3 bucket
aws s3 mb s3://trial-issues-frontend-[unique-id]

# Configure bucket for static website hosting
aws s3 website s3://trial-issues-frontend-[unique-id] \
  --index-document index.html \
  --error-document index.html

# Upload files
aws s3 sync dist/ s3://trial-issues-frontend-[unique-id] --delete

# Make bucket public (or use CloudFront)
aws s3api put-bucket-policy \
  --bucket trial-issues-frontend-[unique-id] \
  --policy file://bucket-policy.json

# Create CloudFront distribution (recommended)
aws cloudfront create-distribution \
  --origin-domain-name trial-issues-frontend-[unique-id].s3-website-us-east-1.amazonaws.com \
  --default-root-object index.html
```

### Environment Variables

**Backend (.env.local - Development):**

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://dev:dev123@localhost:5432/espresso
CORS_ORIGIN=http://localhost:5173
MAX_FILE_SIZE=5mb
```

**Backend (.env.production - Traditional/EC2):**

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://admin:password@rds-endpoint:5432/espresso
CORS_ORIGIN=https://d123456.cloudfront.net
MAX_FILE_SIZE=5mb
```

**Backend (Lambda Environment Variables - Serverless):**

```env
NODE_ENV=production
DATABASE_URL=postgresql://admin:password@rds-endpoint:5432/espresso
CORS_ORIGIN=https://d123456.cloudfront.net
MAX_FILE_SIZE=5mb
AWS_LAMBDA_FUNCTION_NAME=trial-issues-api  # Auto-set by Lambda
```

**Frontend (.env.development):**

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

**Frontend (.env.production - Traditional):**

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
# or
VITE_API_BASE_URL=http://ec2-public-ip:3000/api/v1
```

**Frontend (.env.production - Serverless):**

```env
VITE_API_BASE_URL=https://abc123.execute-api.us-east-1.amazonaws.com/prod/api/v1
```

## Security Considerations

### For This Assignment

1. Input validation on all API endpoints
2. SQL injection prevention (use parameterized queries)
3. File upload validation (CSV only, size limits)
4. CORS configuration (whitelist frontend origin)
5. Basic rate limiting

### For Production

1. **Authentication & Authorization**

   - JWT-based auth
   - Role-based access control (admin, monitor, viewer)
   - Audit logging

2. **Data Security**

   - Encryption at rest (RDS encryption)
   - Encryption in transit (HTTPS, TLS for DB)
   - PHI/PII data handling compliance (HIPAA if applicable)

3. **Infrastructure**
   - WAF (Web Application Firewall)
   - VPC with private subnets for RDS
   - Security groups with minimal access
   - Regular security patches

## Trade-offs & Decisions

### Monolith vs Microservices

**Choice: Monolith**

- Simpler deployment for small project
- Lower operational overhead
- Can split later if needed

### SQL vs NoSQL

**Choice: PostgreSQL (SQL)**

- Structured data with relations
- ACID compliance critical for clinical data
- Better for filtering and aggregations

### Server-side vs Client-side Rendering

**Choice: Client-side (SPA)**

- Simpler deployment (static files)
- Better user experience (no page reloads)
- API can serve multiple clients

### REST vs GraphQL

**Choice: REST**

- Simpler for time-boxed project
- Sufficient for our use case
- Standard and well-understood

### Type Safety

**Consideration: TypeScript**

- Pros: Better developer experience, fewer runtime errors
- Cons: Additional setup time
- Decision: Nice-to-have if time permits

## Scalability Path

### Phase 1 (Current)

- Single EC2 instance
- Single RDS instance
- S3 + CloudFront

### Phase 2 (Growing)

- Auto-scaling EC2 group behind ALB
- RDS read replicas
- Redis for caching
- Implement pagination

### Phase 3 (Scale)

- Containerize with Docker/ECS
- Multi-AZ deployment
- Database partitioning
- CDN optimization
- Consider migrating to serverless (Lambda)

## Monitoring & Observability

### Basic (Free Tier)

- CloudWatch for EC2, RDS metrics
- Application logs to CloudWatch Logs
- Basic health check endpoint

### Production

- APM tool (New Relic, DataDog)
- Error tracking (Sentry)
- Uptime monitoring (PingDom, UptimeRobot)
- Log aggregation (ELK stack or CloudWatch Insights)

## Testing Strategy

### Time-boxed (if time permits)

1. API validation tests (Jest)
2. Database query tests
3. Basic E2E test for critical flow

### Production

1. Unit tests (Jest)
2. Integration tests (Supertest)
3. E2E tests (Playwright/Cypress)
4. Load testing (k6, Artillery)
5. CI/CD pipeline (GitHub Actions)

## Deployment Comparison

### Quick Comparison Table

| Aspect             | Local/On-Prem                     | AWS Serverless (Lambda)             | AWS Traditional (EC2)        |
| ------------------ | --------------------------------- | ----------------------------------- | ---------------------------- |
| **Setup Time**     | 5 minutes (Docker)                | 30-60 minutes                       | 30-60 minutes                |
| **Cost (Dev)**     | $0                                | $0 (within free tier)               | $0 (within free tier)        |
| **Cost (Prod)**    | Hardware/hosting                  | ~$5-10/month (low traffic)          | ~$15-25/month                |
| **Scaling**        | Manual                            | Automatic                           | Manual (can add ASG)         |
| **Cold Start**     | None                              | 300-1000ms                          | None                         |
| **Debugging**      | Easy (local)                      | Moderate (CloudWatch)               | Easy (SSH access)            |
| **Maintenance**    | Medium                            | Low                                 | Medium-High                  |
| **Data Residency** | Full control                      | AWS regions                         | AWS regions                  |
| **Best For**       | Development, On-prem requirements | Variable traffic, cost optimization | Predictable load, simple ops |

### Recommended Approach for This Assignment

**Phase 1: Development (Required)**

1. Start with **Docker Compose** locally
2. Develop and test all features
3. This satisfies the "working system" requirement
4. Total time: ~3-4 hours

**Phase 2: Documentation (Required)**

1. Write comprehensive README
2. Document all three deployment options
3. Explain trade-offs
4. Total time: ~30 minutes

**Phase 3: Cloud Deployment (Optional - "Best Case")**

1. If time permits, choose ONE cloud option:
   - **Serverless** if you want to showcase modern architecture
   - **EC2** if you want simplicity and reliability
2. Deploy and test
3. Total time: ~1 hour

**Suggested Priority:**

```
High Priority (Must Have):
✓ Local development environment with Docker Compose
✓ All features working locally
✓ Clean README with setup instructions
✓ Sample data (issues.csv)

Medium Priority (Should Have):
✓ Code structured for both serverless and traditional
✓ Deployment documentation for all options
✓ Basic tests

Low Priority (Nice to Have):
○ Actual AWS deployment
○ CI/CD pipeline
○ Monitoring setup
```

## Project Structure for Multi-Deployment Support

```
trial-issues/
├── api/                          # Backend
│   ├── src/
│   │   ├── app.js               # Express app (deployment-agnostic)
│   │   ├── routes/              # API routes
│   │   ├── controllers/         # Business logic
│   │   ├── models/              # Data models
│   │   ├── db/
│   │   │   └── connection.js    # DB connection (env-aware)
│   │   ├── middleware/          # Validation, error handling
│   │   └── utils/               # Helpers
│   ├── server.js                # Traditional server entry
│   ├── lambda.js                # Serverless handler entry
│   ├── Dockerfile               # For Docker Compose
│   ├── package.json
│   └── .env.example
│
├── app/                         # Frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── utils/
│   ├── Dockerfile               # For Docker Compose
│   ├── package.json
│   └── .env.example
│
├── db/
│   └── schema.sql               # Database schema
│
├── docker-compose.yml           # Local development
├── docker-compose.prod.yml      # On-prem production
├── serverless.yml               # AWS Serverless config
├── issues.csv                   # Sample data
├── README.md                    # Setup and deployment guide
└── ARCHITECTURE.md              # This document
```

## Estimated Development Timeline

### With Local/On-Prem Focus (Recommended)

Given 3-5 hour constraint:

- **Hour 1:** Setup
  - Docker Compose configuration
  - Database schema
  - Express.js skeleton
  - React + Vite boilerplate
- **Hour 2:** Backend API
  - CRUD endpoints for issues
  - Input validation
  - Error handling
  - Database queries
- **Hour 3:** Frontend Core
  - Issue list with filters
  - Create/edit form
  - Delete functionality
  - Basic styling with Tailwind
- **Hour 4:** Additional Features
  - Dashboard with counts
  - CSV import functionality
  - Resolve button
  - Polish UI
- **Hour 5:** Documentation & Testing
  - README with clear setup instructions
  - Document deployment options
  - Test all features
  - Create sample data

### If Adding Cloud Deployment (+1-2 hours)

- **Extra Hour 1:** AWS Setup
  - Choose deployment strategy (Serverless or EC2)
  - Configure AWS services
  - Deploy application
- **Extra Hour 2:** Testing & Polish
  - Test deployed application
  - Fix CORS/connectivity issues
  - Update README with live URL

## Conclusion

This architecture is designed to be **local-first, cloud-optional**:

### Key Advantages:

1. **Zero Barrier to Entry**

   - Anyone can run `docker-compose up` and have a working system
   - No AWS account needed for evaluation
   - No cloud costs during development

2. **Flexibility**

   - Same codebase works locally, on-prem, and in cloud
   - Easy to switch between serverless and traditional
   - No vendor lock-in

3. **Practical for Time-Box**

   - Can deliver fully working system in 3-5 hours
   - Cloud deployment is bonus, not requirement
   - Reduces risk of incomplete delivery

4. **Production Ready**

   - Docker Compose works for small-scale production
   - Can deploy on-prem for data residency
   - Clear path to cloud when needed

5. **Best Practices**
   - Environment-based configuration
   - Containerized for consistency
   - Clean separation of concerns
   - Well-documented deployment options

### Architecture Priorities:

1. **Simplicity** - Docker Compose, standard stack, minimal complexity
2. **Speed** - Fast development with hot reload, familiar tools
3. **Correctness** - Working end-to-end features that can be tested
4. **Flexibility** - Runs anywhere: local, on-prem, or cloud
5. **Practicality** - Deployable in multiple ways without code changes

The proposed stack (**Express + PostgreSQL + React + Docker**) represents battle-tested technology that balances rapid development with production-readiness, while maintaining the flexibility to deploy in any environment.
