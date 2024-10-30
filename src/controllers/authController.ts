import { Request, Response } from 'express';
import { redisClient } from '../database/redisClient';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sendOTP } from '../utils/email';
import { generateOTP } from '../utils/otp';
import { AppDataSource } from '../database/data-source';
import { User } from '../models/User';

const userRepository = AppDataSource.getRepository(User);

// Register User and Send OTP
export const registerUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body;

    // Check if the email already exists in the main database
    const existingUser = await userRepository.findOneBy({ email });
    if (existingUser) {
      console.log(`Registration attempt for existing email: ${email}`);
      return res.status(400).json({ message: 'Account already exists.' });
    }

    // Check if an OTP is already sent and waiting for verification
    const existingOTP = await redisClient.get(`otp:${email}`);
    if (existingOTP) {
      console.log(`OTP for ${email} already exists: ${existingOTP}`);
      return res.status(400).json({ message: 'OTP already sent. Please verify.' });
    }

    // Hash the password and generate an OTP
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();

    // Store the OTP and user data in Redis with a 5-minute TTL
    await redisClient.set(
      `otp:${email}`,
      JSON.stringify({ email, password: hashedPassword, otp }),
      'EX',
      300 // 5 mins TTL
    );

    console.log(`OTP for ${email}: ${otp}`); // Log OTP for testing purposes

    // Send OTP to the user's email
    await sendOTP(email, otp);

    return res.status(200).json({ message: 'OTP sent. Please verify to complete registration.' });
  } catch (error) {
    console.error('Error during registration:', error);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
};

// Verify OTP and Create User
export const verifyOTPAndCreateUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, otp } = req.body;

    const userData = await redisClient.get(`otp:${email}`);
    if (!userData) {
      console.error(`OTP expired or missing for ${email}`);
      return res.status(400).json({ error: 'OTP expired or invalid.' });
    }

    const parsedData = JSON.parse(userData);
    if (parsedData.otp !== otp) {
      console.error(`Invalid OTP provided for ${email}`);
      return res.status(400).json({ error: 'Invalid OTP.' });
    }

    const user = userRepository.create({
      email: parsedData.email,
      password: parsedData.password,
    });

    await userRepository.save(user);
    await redisClient.del(`otp:${email}`); // Clean up Redis entry

    console.log(`User ${email} registered successfully.`);
    return res.status(201).json({ message: 'User registered successfully.' });
  } catch (error) {
    console.error('Error during OTP verification:', error);
    return res.status(500).json({ error: 'Internal server error during OTP verification.' });
  }
};

// Login User and Generate JWT
export const loginUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body;

    const user = await userRepository.findOneBy({ email });
    if (!user) {
      console.error(`Login failed for ${email}: User not found.`);
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.error(`Login failed for ${email}: Invalid password.`);
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    console.log(`User ${email} logged in successfully.`);
    return res.status(200).json({ token });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
};
