#!/bin/bash

# Trial Issues Tracker - AWS Deployment Script
# This script automates the deployment of the application to AWS

set -e

echo "========================================="
echo "Trial Issues Tracker - AWS Deployment"
echo "========================================="

# Check prerequisites
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is not installed. Please install it first."
        exit 1
    fi
    echo "✅ $1 is installed"
}

echo ""
echo "Checking prerequisites..."
check_command aws
check_command terraform
check_command node
check_command npm
check_command psql

# Check AWS credentials
echo ""
echo "Checking AWS credentials..."
if aws sts get-caller-identity &> /dev/null; then
    echo "✅ AWS credentials configured"
    AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
    AWS_REGION=$(aws configure get region)
    echo "   Account: $AWS_ACCOUNT"
    echo "   Region: $AWS_REGION"
else
    echo "❌ AWS credentials not configured. Run 'aws configure' first."
    exit 1
fi

# Check for terraform.tfvars
echo ""
if [ ! -f "terraform.tfvars" ]; then
    echo "Creating terraform.tfvars from template..."
    cp terraform.tfvars.example terraform.tfvars
    echo "⚠️  Please edit terraform.tfvars with your configuration"
    echo "   Especially set a secure database password!"
    exit 1
fi

# Initialize Terraform
echo ""
echo "Initializing Terraform..."
terraform init

# Plan deployment
echo ""
echo "Planning deployment..."
terraform plan -out=tfplan

# Confirm deployment
echo ""
read -p "Do you want to proceed with deployment? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

# Deploy infrastructure
echo ""
echo "Deploying infrastructure..."
terraform apply tfplan

# Get outputs
echo ""
echo "Getting deployment outputs..."
FRONTEND_URL=$(terraform output -raw frontend_url)
API_URL=$(terraform output -raw api_url)
DB_ENDPOINT=$(terraform output -raw database_endpoint)
DB_NAME=$(terraform output -raw database_name)
LAMBDA_NAME=$(terraform output -raw lambda_function_name)

# Initialize database
echo ""
echo "Initializing database..."
read -p "Enter database password (from terraform.tfvars): " -s DB_PASSWORD
echo ""

# Create the schema
echo "Applying database schema..."
PGPASSWORD=$DB_PASSWORD psql -h ${DB_ENDPOINT%:*} -U admin -d $DB_NAME -f ../db/schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Database initialized successfully"
else
    echo "⚠️  Database initialization failed. You may need to run it manually:"
    echo "   psql postgresql://admin:password@$DB_ENDPOINT/$DB_NAME < ../db/schema.sql"
fi

# Test the API
echo ""
echo "Testing API health endpoint..."
sleep 5  # Give Lambda time to initialize

curl -s "${API_URL}health" | python -m json.tool > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ API is responding"
else
    echo "⚠️  API health check failed. It may need a few minutes to initialize."
fi

# Display summary
echo ""
echo "========================================="
echo "🎉 Deployment Complete!"
echo "========================================="
echo ""
echo "Frontend URL: $FRONTEND_URL"
echo "API URL: $API_URL"
echo ""
echo "Next steps:"
echo "1. Visit the frontend URL to access the application"
echo "2. If using GitHub, push your code to trigger auto-deploy"
echo "3. Monitor Lambda logs: aws logs tail /aws/lambda/$LAMBDA_NAME --follow"
echo ""
echo "To destroy all resources: terraform destroy -auto-approve"
echo "========================================="
