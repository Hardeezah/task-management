"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token)
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err)
            return res.status(403).json({ message: 'Invalid token.' });
        req.user = user;
        next();
    });
};
exports.authenticateToken = authenticateToken;
//# sourceMappingURL=auth.js.map