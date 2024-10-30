import { Request, Response } from 'express';
import { AppDataSource } from '../database/data-source';
import { Task } from '../models/Task';
import nodemailer from 'nodemailer';
import { FindOptionsWhere } from 'typeorm';
import { User } from '../models/User'; // Make sure to import your User entity

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

    // Create a new task instance
    const task = taskRepository.create({
      title,
      description,
      dueDate,
      priority,
      createdBy: user,
      assignedTo: [user], // Assigned to the creator by default (array of users)
    });

    // Save the task to the database
    await taskRepository.save(task);

    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
// Get All Tasks with Pagination

export const getAllTasksWithFilters = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user; // Assuming authMiddleware sets req.user
    if (!user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const page = Math.max(Number(req.query.page) || 1, 1); // Default to 1, min 1
    const limit = Math.min(Number(req.query.limit) || 10, 100); // Default to 10, max 100

    // Extract filters from query parameters
    const { status, priority, tags } = req.query;

    // Build a query using QueryBuilder with filters
    const query = taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.assignedTo', 'assignedTo')
      .leftJoinAndSelect('task.createdBy', 'createdBy')
      .where('assignedTo.id = :userId', { userId: user.id });

    // Apply optional filters if provided
    if (status) {
      query.andWhere('task.status = :status', { status });
    }

    if (priority) {
      query.andWhere('task.priority = :priority', { priority });
    }

    if (tags) {
      const tagList = (tags as string).split(',');
      query.andWhere('task.tags && ARRAY[:...tags]', { tags: tagList }); // Assuming tags is an array column
    }

    // Pagination and sorting
    const [tasks, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('task.createdAt', 'DESC')
      .getManyAndCount();

    // Send response
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

    if (task.createdBy.email !== user.email && task.assignedTo?.some(u => u.email === user.email) === false) {
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
      if (task.createdBy.email !== user.email && task.assignedTo?.some(u => u.email === user.email) === false) {
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

/* export const getAllTasksWithFilters = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user; // Get the user from the request
      if (!user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
  
      const page = Math.max(Number(req.query.page) || 1, 1); // Default to 1, minimum 1
      const limit = Math.min(Number(req.query.limit) || 10, 100); // Default to 10, max 100
  
      // Extract filters from query parameters
      const { status, priority, tags } = req.query;
  
      // Build filter options
      const filterOptions: any = {
        where: {
          assignedTo: user.id, // Only get tasks assigned to the logged-in user
        },
        skip: (page - 1) * limit,
        take: limit,
        relations: ['assignedTo', 'createdBy'],
        order: { createdAt: 'DESC' },
      };
  
      // Add filters based on query parameters
      if (status) {
        filterOptions.where.status = status;
      }
      if (priority) {
        filterOptions.where.priority = priority;
      }
      if (tags) {
        filterOptions.where.tags = (tags as string).split(','); // Assuming tags is a comma-separated string
      }
  
      const [tasks, total] = await taskRepository.findAndCount(filterOptions);
  
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
}; */

 // Share Task by Email
 export const shareTask = async (req: Request, res: Response): Promise<void> => {
  const { taskId, email } = req.body;
  const userId = req.user?.id; // Ensure `req.user` is available from auth middleware

  const taskRepository = AppDataSource.getRepository(Task);
  const userRepository = AppDataSource.getRepository(User);

  try {
    // Check for required fields
    if (!taskId || !email) {
      res.status(400).json({ error: 'Task ID and email are required' });
      return; // Ensure the request ends here
    }

    // Find the task with related entities (createdBy, assignedTo)
    const task = await taskRepository.findOne({
      where: { id: taskId },
      relations: ['createdBy', 'assignedTo'],
    });

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    // Ensure only the task creator can share it
    if (task.createdBy.id !== userId) {
      res.status(403).json({ error: 'Only the creator can share this task' });
      return;
    }

    // Find the user to assign the task to
    const userToShare = await userRepository.findOne({ where: { email } });

    if (!userToShare) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check if the user is already assigned
    const isAlreadyAssigned = task.assignedTo?.some(user => user.id === userToShare.id);

    if (isAlreadyAssigned) {
      res.status(400).json({ error: 'User is already assigned to this task' });
      return;
    }

    // Assign the user to the task
    task.assignedTo = [...(task.assignedTo || []), userToShare];
    await taskRepository.save(task);

    res.status(200).json({ message: 'Task shared successfully!', task });
  } catch (error) {
    console.error('Error sharing task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


  
  
