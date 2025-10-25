# Security Group for RDS
resource "aws_security_group" "rds" {
  name_prefix = "${local.app_name}-rds-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.tags, {
    Name = "${local.app_name}-rds-sg"
  })
}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${local.app_name}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(local.tags, {
    Name = "${local.app_name}-db-subnet-group"
  })
}

# RDS PostgreSQL Instance (Free Tier)
resource "aws_db_instance" "postgres" {
  identifier     = "${local.app_name}-db"
  engine         = "postgres"
  engine_version = "15.4"
  
  # Free tier configuration
  instance_class               = "db.t3.micro"
  allocated_storage           = 20
  storage_type                = "gp2"
  storage_encrypted           = false # Free tier doesn't support encryption
  
  db_name  = "espresso"
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  # Free tier settings
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot       = true
  deletion_protection       = false
  auto_minor_version_upgrade = true
  
  # Performance Insights not available in free tier
  performance_insights_enabled = false
  
  # Monitoring
  enabled_cloudwatch_logs_exports = ["postgresql"]
  
  tags = merge(local.tags, {
    Name = "${local.app_name}-database"
  })
}

# Store database endpoint in SSM Parameter Store
resource "aws_ssm_parameter" "db_host" {
  name  = "/${local.app_name}/db/host"
  type  = "String"
  value = aws_db_instance.postgres.endpoint

  tags = local.tags
}

resource "aws_ssm_parameter" "db_name" {
  name  = "/${local.app_name}/db/name"
  type  = "String"
  value = aws_db_instance.postgres.db_name

  tags = local.tags
}

resource "aws_ssm_parameter" "db_username" {
  name  = "/${local.app_name}/db/username"
  type  = "SecureString"
  value = var.db_username

  tags = local.tags
}

resource "aws_ssm_parameter" "db_password" {
  name  = "/${local.app_name}/db/password"
  type  = "SecureString"
  value = var.db_password

  tags = local.tags
}
