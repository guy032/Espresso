output "frontend_url" {
  description = "Amplify frontend URL"
  value       = "https://main.${aws_amplify_app.frontend.default_domain}"
}

output "api_url" {
  description = "API Gateway URL"
  value       = aws_api_gateway_stage.prod.invoke_url
}

output "database_endpoint" {
  description = "RDS database endpoint"
  value       = aws_db_instance.postgres.endpoint
  sensitive   = true
}

output "database_name" {
  description = "Database name"
  value       = aws_db_instance.postgres.db_name
}

output "amplify_app_id" {
  description = "Amplify App ID"
  value       = aws_amplify_app.frontend.id
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.api.function_name
}

output "deployment_instructions" {
  description = "Post-deployment instructions"
  value = <<-EOT
    
    ========================================
    Trial Issues Tracker Deployment Complete!
    ========================================
    
    Frontend URL: https://main.${aws_amplify_app.frontend.default_domain}
    API URL: ${aws_api_gateway_stage.prod.invoke_url}
    
    Next Steps:
    -----------
    1. Initialize the database:
       aws lambda invoke --function-name ${aws_lambda_function.api.function_name} \
         --payload '{"httpMethod":"GET","path":"/health"}' /tmp/response.json
    
    2. If using GitHub (recommended):
       - Push your code to: ${var.github_repo}
       - Amplify will auto-build on push to ${var.github_branch}
    
    3. Manual deployment (if not using GitHub):
       - Build frontend: cd app && npm run build
       - Deploy to Amplify manually via AWS Console
    
    4. Monitor logs:
       - Lambda logs: aws logs tail /aws/lambda/${aws_lambda_function.api.function_name}
       - Amplify build logs: Check AWS Amplify Console
    
    5. Database access:
       psql postgresql://${var.db_username}@${aws_db_instance.postgres.address}:5432/${aws_db_instance.postgres.db_name}
    
    ========================================
  EOT
}
