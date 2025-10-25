#!/bin/bash

# PostgreSQL Database Setup Script
# This script sets up a local PostgreSQL instance with admin/admin credentials

echo "==================================="
echo "PostgreSQL Setup for Trial Issues"
echo "==================================="

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed!"
    echo "Please install PostgreSQL first:"
    echo "  brew install postgresql@16"
    echo "  brew services start postgresql@16"
    exit 1
fi

echo "✅ PostgreSQL is installed"

# Check if PostgreSQL service is running
if ! pg_isready &> /dev/null; then
    echo "⚠️  PostgreSQL service is not running"
    echo "Starting PostgreSQL..."
    brew services start postgresql@16
    sleep 2
fi

echo "✅ PostgreSQL service is running"

# Create user 'admin' with password 'admin' if not exists
echo "Creating admin user..."
psql -U $USER -d postgres <<EOF
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'admin') THEN
        CREATE USER admin WITH PASSWORD 'admin' CREATEDB;
        GRANT ALL PRIVILEGES ON DATABASE postgres TO admin;
    END IF;
END
\$\$;
EOF

# Create database if not exists
echo "Creating espresso database..."
psql -U $USER -d postgres <<EOF
SELECT 'CREATE DATABASE espresso OWNER admin'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'espresso')\gexec
EOF

# Grant all privileges to admin on espresso database
psql -U $USER -d postgres <<EOF
GRANT ALL PRIVILEGES ON DATABASE espresso TO admin;
ALTER DATABASE espresso OWNER TO admin;
EOF

# Run schema.sql with admin user
echo "Creating schema and tables..."
PGPASSWORD=admin psql -U admin -d espresso -f schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Database setup completed successfully!"
    echo ""
    echo "Database Details:"
    echo "  Database: espresso"
    echo "  User: admin"
    echo "  Password: admin"
    echo "  Host: localhost"
    echo "  Port: 5432"
    echo "  Connection URL: postgresql://admin:admin@localhost:5432/espresso"
    echo ""
    echo "Testing connection..."
    PGPASSWORD=admin psql -U admin -d espresso -c "SELECT COUNT(*) as total_issues FROM issues;"
else
    echo "❌ Error occurred during setup"
    exit 1
fi
