// src/middlewares/authorizeTask.ts
import { Request, Response, NextFunction } from 'express';
import { Task } from '../models/Task';
import { AppDataSource } from '../database/data-source';

const taskRepository = AppDataSource.getRepository(Task);

export const authorizeTaskAccess = async (req: Request, res: Response, next: NextFunction) => {
  const taskId = req.params.id;
  const user = req.user;

  const task = await taskRepository.findOneBy({ id: taskId });

  if (!task) return res.status(404).json({ message: 'Task not found' });

  const isOwner = task.createdBy.id === user.id;
  const isShared = task.assignedTo === user.email;

  if (!isOwner && !isShared) {
    return res.status(403).json({ message: 'You are not authorized to access this task.' });
  }

  next();
};
