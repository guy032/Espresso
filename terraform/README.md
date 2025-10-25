# Trial Issues Tracker - AWS Terraform Deployment

This Terraform configuration deploys the Trial Issues Tracker application to AWS using free tier resources.

## Architecture

- **Frontend**: AWS Amplify (React app)
- **Backend API**: AWS Lambda + API Gateway (Express.js)
- **Database**: RDS PostgreSQL (db.t3.micro - free tier)
- **Network**: VPC with public/private subnets

## Prerequisites

1. **AWS CLI** configured with credentials

```bash
aws configure
```

2. **Terraform** installed (v1.0+)

```bash
brew install terraform  # macOS
```

3. **Node.js** (v18+ for Lambda compatibility)

```bash
node --version
```

## Quick Start

### 1. Configure Variables

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your values:

- Set a secure database password
- (Optional) Add GitHub token for auto-deploy

### 2. Initialize Terraform

```bash
terraform init
```

### 3. Review the Plan

```bash
terraform plan
```

### 4. Deploy

```bash
terraform apply -auto-approve
```

This will take about 10-15 minutes to create all resources.

### 5. Initialize Database

After deployment, run the database migration:

```bash
# Get the database endpoint from outputs
terraform output -raw database_endpoint

# Connect to the database and run the schema
psql postgresql://admin:YourPassword@<endpoint>:5432/espresso < ../db/schema.sql
```

## Outputs

After successful deployment, you'll see:

- **Frontend URL**: Your Amplify app URL
- **API URL**: API Gateway endpoint
- **Database Endpoint**: RDS PostgreSQL connection string

## Manual Deployment (Without GitHub)

If not using GitHub auto-deploy:

### Deploy Frontend to Amplify

```bash
cd ../app
npm install
npm run build
# Upload dist/ folder to Amplify via AWS Console
```

### Deploy API to Lambda

```bash
cd ../api
npm install
npm run build
# The Lambda function is already deployed, just needs the code
aws lambda update-function-code \
  --function-name $(terraform output -raw lambda_function_name) \
  --zip-file fileb://lambda-function.zip
```

## Cost Estimate (Free Tier)

All services are configured for AWS Free Tier:

- **Amplify**: 1000 build minutes/month free
- **Lambda**: 1M requests/month free
- **API Gateway**: 1M API calls/month free (12 months)
- **RDS**: db.t3.micro 750 hours/month free (12 months)
- **VPC**: No charge for VPC itself

Estimated monthly cost after free tier: ~$15-25

## Updating the Application

### With GitHub Integration

Simply push to your configured branch:

```bash
git push origin main
```

Amplify will auto-build and deploy.

### Manual Update

```bash
# Update frontend
cd ../app && npm run build
# Deploy via Amplify Console

# Update API
cd ../api && npm run build
aws lambda update-function-code \
  --function-name $(terraform output -raw lambda_function_name) \
  --zip-file fileb://lambda-function.zip
```

## Monitoring

### View Lambda Logs

```bash
aws logs tail /aws/lambda/$(terraform output -raw lambda_function_name) --follow
```

### View Amplify Build Status

Check the AWS Amplify Console in your browser.

## Cleanup

To destroy all resources and avoid charges:

```bash
terraform destroy -auto-approve
```

## Troubleshooting

### Lambda Cold Starts

First request may take 1-3 seconds. Consider using provisioned concurrency if needed.

### Database Connection Issues

- Ensure Lambda is in VPC private subnets
- Check security group rules
- Verify RDS is in private subnets

### CORS Errors

API Gateway is configured with CORS. If issues persist, check:

- Frontend environment variable `VITE_API_BASE_URL`
- Lambda CORS_ORIGIN environment variable

## Environment Variables

### Frontend (Amplify)

- `VITE_API_BASE_URL`: Set automatically to API Gateway URL

### Backend (Lambda)

- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: production
- `CORS_ORIGIN`: Amplify frontend URL

## Security Notes

1. **Database**: RDS is in private subnets, only accessible from Lambda
2. **Secrets**: Use AWS Secrets Manager for production
3. **API**: Consider adding API Gateway authorizer for production
4. **Encryption**: Enable RDS encryption for production (not free tier)
