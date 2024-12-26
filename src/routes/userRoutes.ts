// src/routes/userRoutes.ts
import { Router } from 'express';
import express, { Request, Response } from 'express';

import { getAllUsers } from '../controllers/userController';

const router = Router();

// Route to get all users
router.get('/all-users', async (req: Request, res: Response) => {
    try {
      await getAllUsers(req, res);
    } catch (error) {
      // Handle error
    }
  });
export default router;
