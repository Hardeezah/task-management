// src/database/data-source.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../models/User';
import { Task } from '../models/Task';
import dotenv from 'dotenv';


dotenv.config(); 

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [User, Task],
  synchronize: true, // Sync models with the database, for dev only
  logging: true,
});
