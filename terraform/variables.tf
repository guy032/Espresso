variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "db_username" {
  description = "Database administrator username"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "db_password" {
  description = "Database administrator password"
  type        = string
  default     = "Admin123!" # Change this in production
  sensitive   = true
}

variable "github_token" {
  description = "GitHub personal access token for Amplify"
  type        = string
  sensitive   = true
  default     = ""
}

variable "github_repo" {
  description = "GitHub repository URL"
  type        = string
  default     = "https://github.com/your-username/trial-issues-tracker"
}

variable "github_branch" {
  description = "GitHub branch to deploy"
  type        = string
  default     = "main"
}
