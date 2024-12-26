"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shareTask = exports.deleteTask = exports.updateTask = exports.getTaskById = exports.getAllTasksWithFilters = exports.createTask = void 0;
const data_source_1 = require("../database/data-source");
const Task_1 = require("../models/Task");
const nodemailer_1 = __importDefault(require("nodemailer"));
const User_1 = require("../models/User"); // Make sure to import your User entity
const redisClient_1 = require("../database/redisClient");
// Task Repository
const taskRepository = data_source_1.AppDataSource.getRepository(Task_1.Task);
// Create Task Handler
const createTask = async (req, res) => {
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
        await redisClient_1.redisClient.del(`user_tasks:${user.id}`);
        console.log(`Cache invalidated for user_tasks:${user.id}`);
        res.status(201).json(task);
        console.log('Response sent:', res.statusCode, res.getHeaders());
    }
    catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ message: 'Internal Server Error' });
        console.log('Response sent:', res.statusCode, res.getHeaders());
    }
};
exports.createTask = createTask;
// Get All Tasks with Pagination
// Get All Tasks with Pagination and Filters
const getAllTasksWithFilters = async (req, res) => {
    try {
        const user = req.user; // Assuming authMiddleware sets req.user
        if (!user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Number(req.query.limit) || 10, 100);
        const cacheKey = `user_tasks:${user.id}:page_${page}:limit_${limit}`;
        const cachedTasks = await redisClient_1.redisClient.get(cacheKey);
        if (cachedTasks) {
            res.status(200).json(JSON.parse(cachedTasks));
            return; // Add return to prevent further execution
        }
        const { status, priority, tags } = req.query;
        const query = taskRepository
            .createQueryBuilder('task')
            .leftJoinAndSelect('task.assignedTo', 'assignedTo')
            .leftJoinAndSelect('task.createdBy', 'createdBy')
            .where('assignedTo.id = :userId', { userId: user.id });
        if (status)
            query.andWhere('task.status = :status', { status });
        if (priority)
            query.andWhere('task.priority = :priority', { priority });
        if (tags) {
            const tagList = tags.split(',');
            query.andWhere('task.tags && ARRAY[:...tags]', { tags: tagList });
        }
        const [tasks, total] = await query
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('task.createdAt', 'DESC')
            .getManyAndCount();
        const result = { total, page, limit, tasks };
        await redisClient_1.redisClient.set(cacheKey, JSON.stringify(result), { ex: 3600 });
        res.status(200).json(result);
    }
    catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getAllTasksWithFilters = getAllTasksWithFilters;
// Get Task by ID
const getTaskById = async (req, res) => {
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
    }
    catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({ error: 'Internal server error' }); // End the request here
    }
};
exports.getTaskById = getTaskById;
// Update Task by ID
const updateTask = async (req, res) => {
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
        await redisClient_1.redisClient.del(`user_tasks:${user.id}`);
        res.status(200).json(updatedTask); // End the request here
    }
    catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Internal server error' }); // End the request here
    }
};
exports.updateTask = updateTask;
// Delete Task by ID
const deleteTask = async (req, res) => {
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
        await redisClient_1.redisClient.del(`user_tasks:${user.id}`);
        res.status(204).send(); // No content response
    }
    catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Internal server error' }); // End the request here
    }
};
exports.deleteTask = deleteTask;
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
const shareTask = async (req, res) => {
    const { taskId, email } = req.body;
    const userId = req.user?.id;
    const taskRepository = data_source_1.AppDataSource.getRepository(Task_1.Task);
    const userRepository = data_source_1.AppDataSource.getRepository(User_1.User);
    try {
        if (!taskId || !email) {
            res.status(400).json({ error: 'taskId and email are required' });
            return;
        }
        const cachedTask = await redisClient_1.redisClient.get(`task:${taskId}`);
        const task = cachedTask ? JSON.parse(cachedTask) : await taskRepository.findOne({ where: { id: taskId } });
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
        if (task.assignedTo.some((u) => u.id === userToShare.id)) {
            res.status(400).json({ error: 'User is already assigned to this task' });
            return;
        }
        task.assignedTo.push(userToShare);
        await taskRepository.save(task);
        const transporter = nodemailer_1.default.createTransport({
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
        }
        catch (mailError) {
            console.error('Error sending email:', mailError);
            res.status(500).json({ error: 'Failed to send email notification' });
        }
    }
    catch (error) {
        console.error('Error sharing task:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.shareTask = shareTask;
//# sourceMappingURL=taskController.js.map