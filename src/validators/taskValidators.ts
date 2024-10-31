// src/validators/taskValidator.ts
import Joi from 'joi';


export const createTaskSchema = Joi.object({
  title: Joi.string().required().messages({
    'string.empty': 'Title is required.',
  }),
  description: Joi.string().required().messages({
    'string.empty': 'Description is required.',
  }),
  dueDate: Joi.date()
    .iso()
    .greater('now')
    .required()
    .messages({
      'date.format': 'Due Date must be in ISO format (YYYY-MM-DD).',
      'date.greater': 'Due Date must be in the future.',
      'any.required': 'Due Date is required.',
      'date.base': 'Due Date is required and should be a valid date in ISO format.',
    }),
  priority: Joi.string()
    .valid('low', 'medium', 'high')
    .default('medium')
    .messages({
      'any.only': 'Priority must be one of low, medium, or high.',
    }),
});


// src/validationSchemas.ts

export const updateTaskSchema = Joi.object({
  title: Joi.string().optional().messages({
    'string.base': 'Title must be a string.',
  }),
  description: Joi.string().optional().messages({
    'string.base': 'Description must be a string.',
  }),
  dueDate: Joi.date()
    .iso()
    .greater('now')
    .optional()
    .messages({
      'date.format': 'Due Date must be in ISO format (YYYY-MM-DD).',
      'date.greater': 'Due Date must be a future date.',
      'date.base': 'Due Date must be a valid date in ISO format.',
    }),
  priority: Joi.string()
    .valid('low', 'medium', 'high')
    .optional()
    .messages({
      'any.only': 'Priority must be one of low, medium, or high.',
    }),
  status: Joi.string()
    .valid('pending', 'in-progress', 'completed')
    .optional()
    .messages({
      'any.only': 'Status must be one of pending, in-progress, or completed.',
    }),
});
