 import { Request, Response } from 'express';
import { createTask } from '../src/controllers/taskController';
import { AppDataSource } from '../src/database/data-source';
import { redisClient } from '../src/database/redisClient';
import { Task } from '../src/models/Task';

// Mock dependencies
jest.mock('../src/database/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

jest.mock('../src/database/redisClient', () => ({
  redisClient: {
    del: jest.fn(),
  },
}));

interface User {
  id: string;
  email: string;
}

interface AuthenticatedRequest extends Request {
  user?: User;
}

describe('createTask', () => {
  let req: Partial<AuthenticatedRequest>;
  let res: Partial<Response>;
  let json: jest.Mock;
  let status: jest.Mock;
  let taskRepository: any;

  beforeEach(() => {
    // Mock response methods
    json = jest.fn();
    status = jest.fn(() => ({ json })) as any;
    res = { status, json };

    // Mock request
    req = {
      body: {},
      user: { id: 'user-id', email: 'test@example.com' },
    };

    // Mock taskRepository methods
    taskRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    // Mock AppDataSource.getRepository to return taskRepository
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(taskRepository);

    // Log to verify mock setup
    console.log('Mocked taskRepository:', taskRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    req.user = undefined;

    await createTask(req as Request, res as Response);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({ message: 'Unauthorized' });
  });

  it('should create and save a new task for authenticated user', async () => {
    req.body = {
      title: 'New Task',
      description: 'Task description',
      dueDate: '2024-12-31',
      priority: 'high',
    };

    const mockTask = {
      ...req.body,
      createdBy: req.user,
      assignedTo: [req.user],
    };

    taskRepository.create.mockReturnValue(mockTask);
    taskRepository.save.mockResolvedValue(mockTask);

    await createTask(req as Request, res as Response);

    expect(AppDataSource.getRepository).toHaveBeenCalledWith(Task);
    expect(taskRepository.create).toHaveBeenCalledWith({
      title: 'New Task',
      description: 'Task description',
      dueDate: '2024-12-31',
      priority: 'high',
      createdBy: req.user,
      assignedTo: [req.user],
    });
    expect(taskRepository.save).toHaveBeenCalledWith(mockTask);
    expect(redisClient.del).toHaveBeenCalledWith(`user_tasks:${req.user!.id}`);
    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith(mockTask);
  });

  it('should return 500 if an error occurs during task creation', async () => {
    req.body = {
      title: 'New Task',
      description: 'Task description',
      dueDate: '2024-12-31',
      priority: 'high',
    };

    taskRepository.create.mockImplementation(() => {
      throw new Error('Database error');
    });

    await createTask(req as Request, res as Response);

    expect(AppDataSource.getRepository).toHaveBeenCalledWith(Task);
    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ message: 'Internal Server Error' });
  });
});
