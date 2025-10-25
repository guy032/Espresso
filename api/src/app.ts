import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import yaml from 'js-yaml';

// Import routes
import issuesRouter from './routes/issues';
import dashboardRouter from './routes/dashboard';
import importRouter from './routes/import';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

// Import Swagger configuration
import { swaggerSpec } from './swagger/config';

dotenv.config();

export function createApp(): Application {
  const app = express();

  // CORS configuration
  const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    optionsSuccessStatus: 200,
  };

  // Middleware
  app.use(cors(corsOptions));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // Swagger documentation endpoints
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Trial Issues API Documentation',
    }),
  );

  // Serve OpenAPI spec as JSON
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(swaggerSpec);
  });

  // Serve OpenAPI spec as YAML (for Orval or other tools)
  app.get('/api-docs.yaml', (_req, res) => {
    res.setHeader('Content-Type', 'text/yaml');
    const yamlStr = yaml.dump(swaggerSpec);
    res.send(yamlStr);
  });

  // API routes
  app.use('/api/v1/issues', issuesRouter);
  app.use('/api/v1/dashboard', dashboardRouter);
  app.use('/api/v1/import', importRouter);

  // 404 handler
  app.use(notFoundHandler);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
