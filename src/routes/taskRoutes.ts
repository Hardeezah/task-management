import express from 'express';
import {
  createTask,
  //getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getAllTasksWithFilters,
  shareTask,
  createSubtask,
  deleteSubtask,
} from '../controllers/taskController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validateRequest';
import { createTaskSchema, updateTaskSchema, createSubtaskSchema } from '../validators/taskValidators';

const router = express.Router();

router.post('/tasks', authMiddleware, validateRequest(createTaskSchema), createTask); // Create a task
router.post('/tasks/subtask', authMiddleware, createSubtask); // Create a task
//router.get('/tasks', authMiddleware, getAllTasks); // Get tasks with pagination
router.get('/tasks/:id', authMiddleware, getTaskById); // Get task by ID
router.put('/tasks/:id', authMiddleware,validateRequest(updateTaskSchema), updateTask); // Update task by ID
router.delete('/tasks/:id', authMiddleware, deleteTask); // Delete task by ID
router.get('/tasks', authMiddleware, getAllTasksWithFilters); // Get tasks with pagination
router.post('/tasks/share', authMiddleware, shareTask); // Get tasks with pagination
router.delete('/tasks/:taskId/subtasks/:subtaskId',authMiddleware, deleteSubtask);

export default router;
