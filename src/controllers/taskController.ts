import { Request, Response } from 'express';
import { AppDataSource } from '../database/data-source';
import { Task } from '../models/Task';

// Task Repository
const taskRepository = AppDataSource.getRepository(Task);

// Create Task Handler
export const createTask = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user; // Assuming authMiddleware sets req.user
      if (!user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
  
      const { title, description, dueDate, priority } = req.body;
      const task = taskRepository.create({
        title,
        description,
        dueDate,
        priority,
        createdBy: user,
        assignedTo: user, // Default assigned to the creator
      });
  
      await taskRepository.save(task);
      res.status(201).json(task);
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };
// Get All Tasks with Pagination
export const getAllTasks = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user; // Assuming authMiddleware sets req.user
        if (!user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const page = Math.max(Number(req.query.page) || 1, 1); // Default to 1, minimum 1
        const limit = Math.min(Number(req.query.limit) || 10, 100); // Default to 10, max 100

        const [tasks, total] = await taskRepository.findAndCount({
            where: {
                assignedTo: { email: user.email } // Filter by assigned email
            },
            skip: (page - 1) * limit,
            take: limit,
            relations: ['assignedTo', 'createdBy'], // Ensure relations are loaded
            order: { createdAt: 'DESC' }, // Optional: Sort tasks by creation date
        });

        res.status(200).json({
            total,
            page,
            limit,
            tasks,
        });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get Task by ID
export const getTaskById = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user; // Assuming authMiddleware sets req.user
        if (!user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const task = await taskRepository.findOne({
            where: {
                id: req.params.id,
                assignedTo: { email: user.email } // Ensure the task is assigned to the user
            },
            relations: ['assignedTo', 'createdBy'], // Ensure relations are loaded
        });

        if (!task) {
            res.status(404).json({ error: 'Task not found' }); // End the request here
            return;
        }

        res.status(200).json(task); // End the request here
    } catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({ error: 'Internal server error' }); // End the request here
    }
};

// Update Task by ID
export const updateTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const user = req.user;

    if (!user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    const task = await taskRepository.findOne({
        where: { id },
        relations: ['assignedTo', 'createdBy'], // Load relations for checking
      });

    if (!task) {
      res.status(404).json({ error: 'Task not found' }); // End the request here
      return;
    }

    if (task.createdBy.email !== user.email && task.assignedTo?.email !== user.email) {
        res.status(403).json({ error: 'Forbidden: You do not have permission to update this task' });
        return;
      }

    const updatedTask = taskRepository.merge(task, updates);
    await taskRepository.save(updatedTask);

    res.status(200).json(updatedTask); // End the request here
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Internal server error' }); // End the request here
  }
};

// Delete Task by ID
export const deleteTask = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const user = req.user; // Assuming authMiddleware sets req.user
  
      if (!user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
      // Find the task
      const task = await taskRepository.findOne({
        where: { id },
        relations: ['assignedTo', 'createdBy'], // Load relations for checking
      });
  
      if (!task) {
        res.status(404).json({ error: 'Task not found' }); // End the request here
        return;
      }
  
      // Check if the user is either the creator or assigned to the task
      if (task.createdBy.email !== user.email && task.assignedTo?.email !== user.email) {
        res.status(403).json({ error: 'Forbidden: You do not have permission to delete this task' });
        return;
      }
  
      await taskRepository.remove(task);
      res.status(204).send(); // No content response
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({ error: 'Internal server error' }); // End the request here
    }
  };
