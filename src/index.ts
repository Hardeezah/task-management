// src/index.ts
import express from 'express';
import 'reflect-metadata';
import { AppDataSource } from './database/data-source';
import authRoutes from './routes/authRoutes';
import taskRoutes from './routes/taskRoutes';
import userRoutes from './routes/userRoutes';
import dotenv from 'dotenv';
import { apiLimiter } from './middlewares/rateLimit';

dotenv.config();

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const app = express();
const swaggerDocument = YAML.load('./swagger.yaml');

// Set up middleware for Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(express.json());

app.use('/users', authRoutes);
app.use('/', taskRoutes, apiLimiter);
app.use('/api', userRoutes);

// Place this at the end of your routes.
app.get('*', (req, res) => {
  res.status(404).send('Not Found');
});

const PORT = process.env.PORT || 5000;

AppDataSource.initialize()
  .then(() => {
    console.log('Database connected!');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err);
  });
