# Create Amplify App for Frontend
resource "aws_amplify_app" "frontend" {
  name       = "${local.app_name}-frontend"
  repository = var.github_repo
  
  # GitHub access token for private repos (optional)
  # access_token = var.github_token

  # Build settings for frontend in monorepo
  build_spec = <<-EOT
    version: 1
    applications:
      - appRoot: app
        frontend:
          phases:
            preBuild:
              commands:
                - npm ci
            build:
              commands:
                - echo "VITE_API_BASE_URL=${aws_api_gateway_stage.prod.invoke_url}" >> .env
                - npm run build
          artifacts:
            baseDirectory: dist
            files:
              - '**/*'
          cache:
            paths:
              - node_modules/**/*
  EOT

  # Custom rewrite rule for SPA
  custom_rule {
    source = "/<*>"
    status = "404-200"
    target = "/index.html"
  }

  # Environment variables
  environment_variables = {
    AMPLIFY_MONOREPO_APP_ROOT = "app"
    NODE_ENV                  = "production"
    _LIVE_UPDATES             = "[{\"pkg\":\"node\",\"type\":\"nvm\",\"version\":\"20\"}]"
  }

  # Platform for static hosting
  platform = "WEB"

  tags = merge(local.tags, {
    Name = "${local.app_name}-amplify-frontend"
  })
}

# Create main branch
resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.frontend.id
  branch_name = var.github_branch

  framework = "React"
  stage     = "PRODUCTION"

  environment_variables = {
    NODE_ENV          = "production"
    VITE_API_BASE_URL = aws_api_gateway_stage.prod.invoke_url
  }

  tags = merge(local.tags, {
    Name = "${local.app_name}-main-branch"
  })
}

# Enable auto build
resource "aws_amplify_webhook" "main" {
  app_id      = aws_amplify_app.frontend.id
  branch_name = aws_amplify_branch.main.branch_name
  description = "Auto deploy on push"
}

# Custom domain (optional - requires domain ownership)
# resource "aws_amplify_domain_association" "main" {
#   app_id      = aws_amplify_app.main.id
#   domain_name = "yourdomain.com"
# 
#   sub_domain {
#     branch_name = aws_amplify_branch.main.branch_name
#     prefix      = ""
#   }
# 
#   sub_domain {
#     branch_name = aws_amplify_branch.main.branch_name
#     prefix      = "www"
#   }
# }
