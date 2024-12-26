"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/database/testConnection.ts
const dotenv_1 = __importDefault(require("dotenv"));
const pg_1 = require("pg");
dotenv_1.default.config();
const pool = new pg_1.Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Connection failed:', err);
    }
    else {
        console.log('PostgreSQL connected:', res.rows[0]);
    }
    pool.end();
});
//# sourceMappingURL=testConnection.js.map