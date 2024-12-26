"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/index.ts
const express_1 = __importDefault(require("express"));
require("reflect-metadata");
const data_source_1 = require("./database/data-source");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const taskRoutes_1 = __importDefault(require("./routes/taskRoutes"));
const dotenv_1 = __importDefault(require("dotenv"));
const rateLimit_1 = require("./middlewares/rateLimit");
dotenv_1.default.config();
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const app = (0, express_1.default)();
const swaggerDocument = YAML.load('./swagger.yaml');
// Set up middleware for Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(express_1.default.json());
app.use('/users', authRoutes_1.default);
app.use('/', taskRoutes_1.default, rateLimit_1.apiLimiter);
// Place this at the end of your routes.
app.get('*', (req, res) => {
    res.status(404).send('Not Found');
});
const PORT = process.env.PORT || 5000;
data_source_1.AppDataSource.initialize()
    .then(() => {
    console.log('Database connected!');
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
})
    .catch((err) => {
    console.error('Database connection failed:', err);
});
//# sourceMappingURL=index.js.map