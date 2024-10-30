// src/index.ts
import express from 'express';
import 'reflect-metadata';
import { AppDataSource } from './database/data-source';
import authRoutes from './routes/authRoutes';
import taskRoutes from './routes/taskRoutes';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/api', taskRoutes);

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
