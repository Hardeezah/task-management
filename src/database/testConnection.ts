// src/database/testConnection.ts
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

pool.query('SELECT NOW()', (err: any, res: { rows: any[]; }) => {
  if (err) {
    console.error('Connection failed:', err);
  } else {
    console.log('PostgreSQL connected:', res.rows[0]);
  }
  pool.end();
});
