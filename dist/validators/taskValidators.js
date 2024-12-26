"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = exports.updateTaskSchema = exports.createTaskSchema = exports.createUserSchema = void 0;
// src/validators/taskValidator.ts
const joi_1 = __importDefault(require("joi"));
exports.createUserSchema = joi_1.default.object({
    email: joi_1.default.string().email().required().messages({
        'string.empty': 'Email is required.',
        'string.email': 'Email must be a valid email address.',
    }),
    password: joi_1.default.string().min(8).required().messages({
        'string.empty': 'Password is required.',
        'string.min': 'Password must be at least 8 characters long.',
    }),
});
exports.createTaskSchema = joi_1.default.object({
    title: joi_1.default.string().required().messages({
        'string.empty': 'Title is required.',
    }),
    description: joi_1.default.string().required().messages({
        'string.empty': 'Description is required.',
    }),
    dueDate: joi_1.default.date()
        .iso()
        .greater('now')
        .required()
        .messages({
        'date.format': 'Due Date must be in ISO format (YYYY-MM-DD).',
        'date.greater': 'Due Date must be in the future.',
        'any.required': 'Due Date is required.',
        'date.base': 'Due Date is required and should be a valid date in ISO format.',
    }),
    priority: joi_1.default.string()
        .valid('low', 'medium', 'high')
        .default('medium')
        .messages({
        'any.only': 'Priority must be one of low, medium, or high.',
    }),
});
// src/validationSchemas.ts
exports.updateTaskSchema = joi_1.default.object({
    title: joi_1.default.string().optional().messages({
        'string.base': 'Title must be a string.',
    }),
    description: joi_1.default.string().optional().messages({
        'string.base': 'Description must be a string.',
    }),
    dueDate: joi_1.default.date()
        .iso()
        .greater('now')
        .optional()
        .messages({
        'date.format': 'Due Date must be in ISO format (YYYY-MM-DD).',
        'date.greater': 'Due Date must be a future date.',
        'date.base': 'Due Date must be a valid date in ISO format.',
    }),
    priority: joi_1.default.string()
        .valid('low', 'medium', 'high')
        .optional()
        .messages({
        'any.only': 'Priority must be one of low, medium, or high.',
    }),
    status: joi_1.default.string()
        .valid('pending', 'in-progress', 'completed')
        .optional()
        .messages({
        'any.only': 'Status must be one of pending, in-progress, or completed.',
    }),
});
exports.changePasswordSchema = joi_1.default.object({
    currentPassword: joi_1.default.string().required().messages({
        'string.empty': 'current password is required.',
    }),
    newPassword: joi_1.default.string().min(8).required().messages({
        'string.empty': 'New paasowrd is required.',
        'string.min': 'Password must be at least 8 characters long.',
    }),
});
//# sourceMappingURL=taskValidators.js.map