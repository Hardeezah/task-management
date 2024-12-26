// src/database/data-source.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../models/User';
import { Task } from '../models/Task';
import dotenv from 'dotenv';


dotenv.config(); 

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  /* host: process.env.DATABASE_URL,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME, */
  entities: [User, Task],
  synchronize: process.env.NODE_ENV !== 'production', // Avoid syncing in prod
  logging: process.env.NODE_ENV === 'development',
  ssl: {
    rejectUnauthorized: false,
  },
});
