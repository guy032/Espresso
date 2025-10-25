# IAM Role for Lambda
resource "aws_iam_role" "lambda" {
  name = "${local.app_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = local.tags
}

# IAM Policy for Lambda to access RDS and CloudWatch
resource "aws_iam_role_policy" "lambda" {
  name = "${local.app_name}-lambda-policy"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:AssignPrivateIpAddresses",
          "ec2:UnassignPrivateIpAddresses"
        ]
        Resource = "*"
      }
    ]
  })
}

# Attach AWS managed policy for VPC access
resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# Lambda Layer for dependencies
resource "aws_lambda_layer_version" "deps" {
  filename            = "${path.module}/lambda-layer.zip"
  layer_name          = "${local.app_name}-deps"
  compatible_runtimes = ["nodejs18.x", "nodejs20.x"]
  
  description = "Node modules for Trial Issues API"

  depends_on = [null_resource.build_lambda_layer]
}

# Lambda Function for API
resource "aws_lambda_function" "api" {
  filename         = "${path.module}/lambda-function.zip"
  function_name    = "${local.app_name}-api"
  role            = aws_iam_role.lambda.arn
  handler         = "lambda.handler"
  runtime         = "nodejs20.x"
  timeout         = 30
  memory_size     = 512 # Free tier includes 400,000 GB-seconds per month

  layers = [aws_lambda_layer_version.deps.arn]

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      NODE_ENV     = "production"
      DATABASE_URL = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.postgres.address}:5432/${aws_db_instance.postgres.db_name}"
      CORS_ORIGIN  = "https://${aws_amplify_app.frontend.default_domain}"
      MAX_FILE_SIZE = "5mb"
    }
  }

  depends_on = [
    null_resource.build_lambda_function,
    aws_iam_role_policy.lambda,
    aws_iam_role_policy_attachment.lambda_vpc
  ]

  tags = merge(local.tags, {
    Name = "${local.app_name}-api-lambda"
  })
}

# Security Group for Lambda
resource "aws_security_group" "lambda" {
  name_prefix = "${local.app_name}-lambda-"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.tags, {
    Name = "${local.app_name}-lambda-sg"
  })
}

# Build Lambda deployment package
resource "null_resource" "build_lambda_function" {
  triggers = {
    always_run = "${timestamp()}"
  }

  provisioner "local-exec" {
    command = <<-EOT
      cd ${path.module}/../api
      npm ci --production
      npm run build
      zip -r ${path.module}/lambda-function.zip dist src package.json lambda.js -x "*/node_modules/*"
    EOT
  }
}

# Build Lambda layer with dependencies
resource "null_resource" "build_lambda_layer" {
  triggers = {
    always_run = "${timestamp()}"
  }

  provisioner "local-exec" {
    command = <<-EOT
      cd ${path.module}/../api
      mkdir -p ${path.module}/lambda-layer/nodejs
      cp package.json package-lock.json ${path.module}/lambda-layer/nodejs/
      cd ${path.module}/lambda-layer/nodejs
      npm ci --production
      cd ${path.module}/lambda-layer
      zip -r ${path.module}/lambda-layer.zip nodejs
      rm -rf ${path.module}/lambda-layer
    EOT
  }
}
