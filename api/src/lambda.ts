// Lambda handler for serverless deployment
import serverless from 'serverless-http';
import { createApp } from './app';

// Create Express app
const app = createApp();

// Export handler for Lambda
export const handler = serverless(app, {
  binary: ['image/*', 'application/pdf', 'application/octet-stream'],
});
