// src/middlewares/validateRequest.ts
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      res.status(400).json({
        message: 'Validation error',
        details: error.details.map((detail) => detail.message),
      });
    } else {
      next(); // Call next if validation is successful
    }
  };
};
