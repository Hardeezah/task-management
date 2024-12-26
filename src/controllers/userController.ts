// src/controllers/userController.ts
import { Request, Response } from 'express';
import { AppDataSource } from '../database/data-source';
import { User } from '../models/User';

// Repository for User
const userRepository = AppDataSource.getRepository(User);

// Controller to retrieve all users
export const getAllUsers = async (req: Request, res: Response): Promise<Response> => {
  try {
    const users = await userRepository.find(); // Fetch all users
    return res.status(200).json(users); // Return the users as JSON
  } catch (error) {
    console.error('Error retrieving users:', error);
    return res.status(500).json({ error: 'Internal server error while retrieving users.' });
  }
};
