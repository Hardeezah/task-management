import { Request, Response } from 'express';
import { AppDataSource } from '../database/data-source';
import { Task } from '../models/Task';
import nodemailer from 'nodemailer';
import { User } from '../models/User'; // Make sure to import your User entity
import { redisClient } from '../database/redisClient';

// Task Repository
const taskRepository = AppDataSource.getRepository(Task);

// Create Task Handler
export const createTask = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Request received:', { body: req.body, user: req.user });

    console.log('Response received:', res.statusCode, res.getHeaders());
    
    const user = req.user; // Assuming authMiddleware sets req.user
    if (!user) {
      console.log('Unauthorized access attempt');
      res.status(401).json({ message: 'Unauthorized' });
      console.log('Response sent:', res.statusCode, res.getHeaders());
      return;
    }

    const { title, description, dueDate, priority } = req.body;

    console.log('Before task Creation Response sent:', res.statusCode, res.getHeaders());
    // Create a new task instance
    const task = taskRepository.create({
      title,
      description,
      dueDate,
      priority,
      createdBy: user,
      assignedTo: [user], // Assigned to the creator by default (array of users)
    });
    //console.log('Task created:', task);

    // Save the task to the database
    await taskRepository.save(task);
    //console.log('Task saved:', task);

    // Invalidate cache for the user's tasks
    await redisClient.del(`user_tasks:${user.id}`);
    console.log(`Cache invalidated for user_tasks:${user.id}`);

    res.status(201).json(task);
    console.log('Response sent:', res.statusCode, res.getHeaders());
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Internal Server Error' });
    console.log('Response sent:', res.statusCode, res.getHeaders());
  }
};

// Get All Tasks with Pagination

// Get All Tasks with Pagination and Filters
/* export const getAllTasksWithFilters = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user; // Assuming authMiddleware sets req.user
    if (!user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 100);

    const cacheKey = `user_tasks:${user.id}:page_${page}:limit_${limit}`;
    const cachedTasks = await redisClient.get(cacheKey);

    if (cachedTasks) {
      res.status(200).json(JSON.parse(cachedTasks as string));
      return; // Add return to prevent further execution
    }

    const { status, priority, tags } = req.query;

    const query = taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.assignedTo', 'assignedTo')
      .leftJoinAndSelect('task.createdBy', 'createdBy')
      .where('assignedTo.id = :userId', { userId: user.id });

    if (status) query.andWhere('task.status = :status', { status });
    if (priority) query.andWhere('task.priority = :priority', { priority });
    if (tags) {
      const tagList = (tags as string).split(',');
      query.andWhere('task.tags && ARRAY[:...tags]', { tags: tagList });
    }

    const [tasks, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('task.createdAt', 'DESC')
      .getManyAndCount();

    const result = { total, page, limit, tasks };
    await redisClient.set(cacheKey, JSON.stringify(result), {ex: 3600});

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; */
export const getAllTasksWithFilters = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user; // Assuming authMiddleware sets req.user
    if (!user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 100);

    const cacheKey = `user_tasks:${user.id}:page_${page}:limit_${limit}`;
    const cachedTasks = await redisClient.get(cacheKey);

    if (cachedTasks) {
      try {
        // Ensure the cached data is a valid JSON string
        const parsedTasks = JSON.parse(cachedTasks as string);
        res.status(200).json(parsedTasks);
        return;
      } catch (parseError) {
        console.error('Error parsing cached tasks:', parseError);
        // Optionally, clear the cache if it's corrupted
        await redisClient.del(cacheKey);
      }
    }

    const { status, priority, tags } = req.query;

    const query = taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.assignedTo', 'assignedTo')
      .leftJoinAndSelect('task.createdBy', 'createdBy')
      .leftJoinAndSelect('task.subtasks', 'subtask') // Ensure subtasks are included within the task
      .where('createdBy.id = :userId', { userId: user.id }) // Task created by the user
      .orWhere('assignedTo.id = :userId', { userId: user.id }); // Or assigned to the user

    if (status) query.andWhere('task.status = :status', { status });
    if (priority) query.andWhere('task.priority = :priority', { priority });
    if (tags) {
      const tagList = (tags as string).split(',');
      query.andWhere('task.tags && ARRAY[:...tags]', { tags: tagList });
    }

    const [tasks, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('task.createdAt', 'DESC')
      .getManyAndCount();

    // If necessary, you can modify or filter the subtasks here
    tasks.forEach(task => {
      task.subtasks = task.subtasks || []; // Ensure subtasks exist for each task
    });

    const result = { total, page, limit, tasks };

    // Cache the result
    await redisClient.set(cacheKey, JSON.stringify(result), { ex: 3600 });

    res.status(200).json(result);
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

    // Invalidate cache for the user's tasks
    await redisClient.del(`user_tasks:${user.id}`);

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

       // Invalidate cache for the user's tasks
      await redisClient.del(`user_tasks:${user.id}`);
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
  const userId = req.user?.id;

  const taskRepository = AppDataSource.getRepository(Task);
  const userRepository = AppDataSource.getRepository(User);

  try {
    if (!taskId || !email) {
      res.status(400).json({ error: 'taskId and email are required' });
      return;
    }

    const cachedTask = await redisClient.get(`task:${taskId}`);
    const task = cachedTask ? JSON.parse(cachedTask as string) : await taskRepository.findOne({ where: { id: taskId } });

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    if (task.createdBy.email !== req.user?.email) {
      res.status(403).json({ error: 'You are not authorized to share this task' });
      return;
    }

    const userToShare = await userRepository.findOne({ where: { email } });
    if (!userToShare) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (task.assignedTo.some((u: User) => u.id === userToShare.id)) {
      res.status(400).json({ error: 'User is already assigned to this task' });
      return;
    }

    task.assignedTo.push(userToShare);
    await taskRepository.save(task);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Task Shared with You',
        text: `The task "${task.title}" has been shared with you. Check your task manager for details.`,
      });
      res.status(200).json({ message: 'Task shared successfully' });
    } catch (mailError) {
      console.error('Error sending email:', mailError);
      res.status(500).json({ error: 'Failed to send email notification' });
    }
  } catch (error) {
    console.error('Error sharing task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// Create Subtask Handler
// Create Subtask Handler
export const createSubtask = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user; // Assuming authMiddleware sets req.user
    if (!user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Destructure the data from the request body
    const { parentTaskId, title, description, dueDate, priority } = req.body;

    // Validate the required fields
    if (!parentTaskId || !title || !description || !dueDate || !priority) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Find the parent task
    const parentTask = await taskRepository.findOne({
      where: { id: parentTaskId },
      relations: ['assignedTo', 'createdBy'],
    });

    if (!parentTask) {
      res.status(404).json({ error: 'Parent task not found' });
      return;
    }

    // Check if the user has permission to create a subtask for this parent task
    if (parentTask.createdBy.email !== user.email && !parentTask.assignedTo.some(u => u.email === user.email)) {
      res.status(403).json({ error: 'You are not authorized to create a subtask for this task' });
      return;
    }

    // Create the subtask instance
    const subtask = taskRepository.create({
      title,
      description,
      dueDate,
      priority,
      createdBy: user,
      assignedTo: parentTask.assignedTo, // Inherit the same assigned users (you can adjust this as needed)
      parentTask: parentTask, // Set the parent task relationship
    });

    // Save the subtask to the database
    await taskRepository.save(subtask);

    // Invalidate cache for the user's tasks
    await redisClient.del(`user_tasks:${user.id}`);
    console.log(`Cache invalidated for user_tasks:${user.id}`);

    res.status(201).json(subtask);
  } catch (error) {
    console.error('Error creating subtask:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Delete Subtask by ID
export const deleteSubtask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId, subtaskId } = req.params; // Assuming taskId and subtaskId are passed as params
    const user = req.user; // Assuming authMiddleware sets req.user

    if (!user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Find the task
    const task = await taskRepository.findOne({
      where: { id: taskId },
      relations: ['assignedTo', 'createdBy', 'subtasks'], // Include subtasks in the relations
    });

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    // Check if the user is either the creator or assigned to the task
    if (task.createdBy.email !== user.email && !task.assignedTo.some(u => u.email === user.email)) {
      res.status(403).json({ error: 'Forbidden: You do not have permission to delete this subtask' });
      return;
    }

    // Find the subtask to delete
    const subtaskIndex = task.subtasks.findIndex(subtask => subtask.id === subtaskId);

    if (subtaskIndex === -1) {
      res.status(404).json({ error: 'Subtask not found' });
      return;
    }

    // Remove the subtask from the task's subtasks array
    task.subtasks.splice(subtaskIndex, 1);

    // Save the updated task
    await taskRepository.save(task);

    // Invalidate cache for the user's tasks
    await redisClient.del(`user_tasks:${user.id}`);

    res.status(204).send(); // No content response
  } catch (error) {
    console.error('Error deleting subtask:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Fetch All Subtasks for a Task
/* export const getSubtasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user; // Assuming authMiddleware sets req.user
    if (!user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { taskId } = req.params;

    // Check cache first
    const cacheKey = `task_subtasks:${taskId}`;
    const cachedSubtasks = await redisClient.get(cacheKey);

    if (cachedSubtasks) {
      res.status(200).json(JSON.parse(cachedSubtasks));
      return;
    }

    // Find the parent task
    const parentTask = await taskRepository.findOne({
      where: { id: taskId },
    });

    if (!parentTask) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    // Fetch all subtasks for the given parent task
    const subtasks = await taskRepository.find({
      where: { parentTask: { id: taskId } },
      relations: ['createdBy', 'assignedTo'],
    });

    // Cache the subtasks
    await redisClient.set(cacheKey, JSON.stringify(subtasks), { ex: 3600 });

    res.status(200).json(subtasks);
  } catch (error) {
    console.error('Error fetching subtasks:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}; */
  
  