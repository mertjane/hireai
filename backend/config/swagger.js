// config/swagger.js
import swaggerJsdoc from 'swagger-jsdoc';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hire AI API',
      version: '1.0.0',
      description: 'API documentation for Hire AI',
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Development server',
      },
    ],
  },
  apis: [
    path.join(__dirname, '../modules/**/*.yaml'),
  ],
};

export const specs = swaggerJsdoc(options);