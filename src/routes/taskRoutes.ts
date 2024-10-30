import express from 'express';
import {
  createTask,
  //getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getAllTasksWithFilters,
  shareTask,
} from '../controllers/taskController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/tasks', authMiddleware, createTask); // Create a task
//router.get('/tasks', authMiddleware, getAllTasks); // Get tasks with pagination
router.get('/tasks/:id', authMiddleware, getTaskById); // Get task by ID
router.put('/tasks/:id', authMiddleware, updateTask); // Update task by ID
router.delete('/tasks/:id', authMiddleware, deleteTask); // Delete task by ID
router.get('/tasks', authMiddleware, getAllTasksWithFilters); // Get tasks with pagination
router.post('/tasks/share', authMiddleware, shareTask); // Get tasks with pagination

export default router;
