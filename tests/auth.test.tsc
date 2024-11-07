// src/controllers/__tests__/authController.test.ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { AppDataSource } from '../src/database/data-source';
import { registerUser } from '../src/controllers/authController';
import { redisClient } from '../src/database/redisClient';
import { sendOTP } from '../src/utils/email';
import { User } from '../src/models/User'; // Adjust the path as necessary

// Mock Redis Client
jest.mock('./../src/database/redisClient', () => ({
  redisClient: {
    get: jest.fn(),
    set: jest.fn(),
  },
}));

// Mock sendOTP to avoid real email sending
jest.mock('./../src/utils/email', () => ({
  sendOTP: jest.fn(),
}));

// Mock bcrypt.hash to avoid actual hashing
jest.spyOn(bcrypt, 'hash').mockImplementation(async () => 'hashedPassword');

// Mock AppDataSource to provide a user repository
jest.mock('./../src/database/data-source', () => ({
  AppDataSource: {
    getRepository: () => ({
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    }),
  },
}));

describe('registerUser', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let json: jest.Mock;
  let status: jest.Mock;
  let mockUserRepository: any;

  beforeEach(() => {
    // Clear all mocks to ensure a clean slate between tests
    jest.clearAllMocks();

    // Define mock functions for Express response object
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });

    req = {
      body: {
        email: 'test@example.com',
        password: 'password123',
      },
    };

    res = {
      status,
    };

    // Assign the mock user repository from AppDataSource
    mockUserRepository = AppDataSource.getRepository(User); // Pass the User entity
    mockUserRepository.findOneBy.mockResolvedValue(null); // Reset to null before each test
  });

  it('should return 400 if user already exists', async () => {
    mockUserRepository.findOneBy.mockResolvedValueOnce({ email: 'test@example.com' });
    
    await registerUser(req as Request, res as Response);
    
    console.log('Status:', status.mock.calls); // Log the calls to status
    console.log('JSON Response:', json.mock.calls); // Log the calls to json
    
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ message: 'Account already exists.' });
  });
  
  it('should return 400 if OTP already sent', async () => {
    // Simulate OTP already existing in Redis
    (redisClient.get as jest.Mock).mockResolvedValue('123456');

    await registerUser(req as Request, res as Response);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ message: 'OTP already sent. Please verify.' });
  });

  it('should send OTP and return 200 if user does not exist and no OTP is present', async () => {
    mockUserRepository.findOneBy.mockResolvedValue(null);
    (redisClient.get as jest.Mock).mockResolvedValue(null);

    await registerUser(req as Request, res as Response);

    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    expect(sendOTP).toHaveBeenCalledWith('test@example.com', expect.any(String));
    expect(redisClient.set).toHaveBeenCalledWith(
      `otp:test@example.com`,
      expect.any(String),
      'EX',
      300
    );
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ message: 'OTP sent. Please verify to complete registration.' });
  });

  it('should return 500 if an error occurs', async () => {
    // Simulate an error in the repository
    mockUserRepository.findOneBy.mockRejectedValue(new Error('Database error'));

    await registerUser(req as Request, res as Response);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ error: 'Internal server error during registration.' });
  });
});
