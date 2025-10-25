# Trial Issues Tracker

Full-stack application for tracking clinical trial issues. Built with TypeScript, React, Express, and PostgreSQL.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Git

**Quick install on macOS:**

```bash
brew install node@20 postgresql@16
brew services start postgresql@16
```

## Setup

### 1. Clone and Setup Database

```bash
# Clone repository
git clone <repository-url>
cd Espresso

# Setup database
cd db
chmod +x setup.sh
./setup.sh
```

### 2. Start Backend

```bash
cd ../api
npm install
cp env.example .env
npm run dev
```

Backend runs at: http://localhost:3000

### 3. Start Frontend

Open new terminal:

```bash
cd app
npm install
cp env.example .env
npm run dev
```

Frontend runs at: http://localhost:5173

## Quick Test

1. **Import sample data:** Navigate to http://localhost:5173/issues/import and upload `issues.csv`
2. **API docs:** http://localhost:3000/api-docs

## Project Structure

```
Espresso/
├── api/                    # Backend API (Express + TypeScript)
│   ├── src/               # Source code
│   └── tests/             # API tests
├── app/                    # Frontend (React + Vite)
│   └── src/               # Source code
├── db/                     # Database scripts
│   ├── schema.sql         # Database schema
│   └── setup.sh           # Setup script
└── issues.csv             # Sample data
```

## Development Commands

**Backend:**

```bash
cd api
npm run dev          # Start with hot reload
npm test            # Run tests
npm run build       # Build for production
```

**Frontend:**

```bash
cd app
npm run dev         # Start dev server
npm run build       # Build for production
npm run preview     # Preview production build
```

## Troubleshooting

**PostgreSQL not running:**

```bash
brew services restart postgresql@16
```

**Port already in use:**

```bash
lsof -i :3000  # Find process on port 3000
lsof -i :5173  # Find process on port 5173
kill -9 <PID>  # Kill the process
```

**Wrong Node version:**

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

**Manual database setup (if script fails):**

```bash
psql -U $USER -d postgres
CREATE USER admin WITH PASSWORD 'admin' CREATEDB;
CREATE DATABASE espresso OWNER admin;
\q
PGPASSWORD=admin psql -U admin -d espresso -f schema.sql
```
