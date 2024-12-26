"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
// src/database/data-source.ts
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const User_1 = require("../models/User");
const Task_1 = require("../models/Task");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    /* host: process.env.DATABASE_URL,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME, */
    entities: [User_1.User, Task_1.Task],
    synchronize: process.env.NODE_ENV !== 'production', // Avoid syncing in prod
    logging: process.env.NODE_ENV === 'development',
    ssl: {
        rejectUnauthorized: false,
    },
});
//# sourceMappingURL=data-source.js.map