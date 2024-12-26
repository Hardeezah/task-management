import { Request, Response } from 'express';
import { redisClient } from '../database/redisClient';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sendOTP } from '../utils/email';
import { generateOTP } from '../utils/otp';
import { AppDataSource } from '../database/data-source';
import { User } from '../models/User';
import { OAuth2Client } from 'google-auth-library';


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
      { ex: 900 } // 5 mins 
    );

    console.log(`OTP for ${email}: ${otp}`); 

    // Send OTP to the user's email
    await sendOTP(email, otp);

    return res.status(200).json({ message: 'OTP sent. Please verify to complete registration.' });
  } catch (error) {
    console.error('Error during registration:', error);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
};

// Verify OTP and Create User
/* export const verifyOTPAndCreateUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, otp } = req.body;

    const userData = await redisClient.get(`otp:${email}`);
    console.log('Raw userData from Redis:', userData);
    // Add a null check to handle the absence of data
    if (!userData) {
      console.error(`OTP expired or missing for ${email}`);
      return res.status(400).json({ error: 'OTP expired or invalid.' });
    }
    
    // TypeScript expects a string for JSON.parse; we cast userData as a string
    //const parsedData = JSON.parse(userData as string);
    if (typeof userData !== 'string') {
      console.error(`Invalid data format for ${email}. Expected a string.`);
      return res.status(500).json({ error: 'Invalid data format received.' });
    }
    
    const parsedData = JSON.parse(userData);
    
    
    // Validate the OTP
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
}; */

export const verifyOTPAndCreateUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, otp } = req.body;

    // Retrieve data from Redis
    const userData = await redisClient.get(`otp:${email}`);
    console.log('Raw userData from Redis:', userData);

    // Handle both string and object formats
    let parsedData;
    if (typeof userData === 'string') {
      parsedData = JSON.parse(userData);
    } else if (typeof userData === 'object' && userData !== null) {
      parsedData = userData;
    } else {
      console.error(`Invalid data format for ${email}:`, userData);
      return res.status(500).json({ error: 'Invalid data format received.' });
    }

    // Validate the OTP
    if (parsedData.otp !== otp) {
      console.error(`Invalid OTP provided for ${email}`);
      return res.status(400).json({ error: 'Invalid OTP.' });
    }

    // Create and save the user
    const user = userRepository.create({
      email: parsedData.email,
      password: parsedData.password,
    });
    await userRepository.save(user);

    // Clean up Redis
    await redisClient.del(`otp:${email}`);
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

    const isPasswordValid = user.password && await bcrypt.compare(password, user.password);
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

// Initiate Password Reset with OTP
export const initiatePasswordReset = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email } = req.body;

    // Check if the email exists in the database
    const user = await userRepository.findOneBy({ email });
    if (!user) {
      return res.status(400).json({ message: 'User with this email does not exist.' });
    }

    // Check if OTP is already sent
    const existingOTP = await redisClient.get(`password-reset-otp:${email}`);
    if (existingOTP) {
      return res.status(400).json({ message: 'OTP already sent. Please verify to reset your password.' });
    }

    // Generate OTP and store in Redis with a 10-minute TTL
    const otp = generateOTP();
    await redisClient.set(`password-reset-otp:${email}`, JSON.stringify({ otp }), { ex: 600 }); // 10 mins TTL
    console.log(redisClient)
    console.log(`OTP for ${email}: ${otp}`);
    await sendOTP(email, otp);

    return res.status(200).json({ message: 'Password reset OTP sent. Please verify to proceed.' });
  } catch (error) {
    console.error('Error during password reset initiation:', error);
    return res.status(500).json({ error: 'Internal server error during password reset initiation.' });
  }
};

// Verify OTP and Set Verified Status
export const verifyPasswordResetOTP = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, otp } = req.body;

    // Retrieve OTP from Redis
    const otpData = await redisClient.get(`password-reset-otp:${email}`);
    if (!otpData) {
      return res.status(400).json({ error: 'OTP expired or invalid.' });
    }

    const parsedData = JSON.parse(otpData as string);
    if (parsedData.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP.' });
    }

    // Set verified flag in Redis after successful OTP verification and delete OTP
    await redisClient.del(`password-reset-otp:${email}`);
    await redisClient.set(`verified:${email}`, JSON.stringify({ verified: true }), {ex: 600}); // Verified for 10 mins
    console.log(redisClient)
    return res.status(200).json({ message: 'OTP verified successfully. You may now reset your password.' });
  } catch (error) {
    console.error('Error during OTP verification:', error);
    return res.status(500).json({ error: 'Internal server error during OTP verification.' });
  }
};

// Update Password for Verified User
export const updatePassword = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { newPassword } = req.body;
    const { email } = req.params;

    // Check if the verified status exists in Redis
    const verificationData = await redisClient.get(`verified:${email}`);
    if (!verificationData) {
      return res.status(400).json({ message: 'Email not verified or verification expired. Please request a new OTP.' });
    }

    const parsedData = JSON.parse(verificationData as string);
    if (!parsedData.verified) {
      return res.status(400).json({ message: 'Email verification is required to reset password.' });
    }

    // Find the user in the database
    const user = await userRepository.findOneBy({ email });
    if (!user) {
      return res.status(400).json({ message: 'User with this email does not exist.' });
    }

    // Hash and update the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await userRepository.save(user);

    // Clean up the verified flag from Redis after password reset
    await redisClient.del(`verified:${email}`);

    return res.status(200).json({ message: 'Password reset successfully.' });
  } catch (error) {
    console.error('Error during password reset:', error);
    return res.status(500).json({ error: 'Internal server error during password reset.' });
  }
};

export const changePassword = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Extract token from headers
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: 'Authorization token missing.' });
    }

    // Verify and decode the token to get user email
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!);
    const userEmail = (decodedToken as { email: string }).email;

    // Find user by email
    const user = await userRepository.findOneBy({ email: userEmail });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Check if the current password matches the stored password
    const isPasswordValid = user.password && await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect or not set.' });
    }
    
    if(currentPassword === user.password) {
      return res.status(400).json({ error: 'Current password cannot be the same as the new password.' });
    }      

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password in the database
    user.password = hashedNewPassword;
    await userRepository.save(user);

    return res.status(200).json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Error during password change:', error);
    return res.status(500).json({ error: 'Internal server error during password change.' });
  }
};


const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/* export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    console.log("Received Google token:", token);
    const parts = token.split(".");
    console.log("Token Parts:", parts);
    // Verify the token with Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({ message: 'Invalid Google token.' });
    }

    // Extract user details from the Google payload
    const { email, sub: googleId, name } = payload;

    // Check if the user already exists
    let user = await userRepository.findOneBy({ email });

    // Register the user if they do not exist
    if (!user) {
      user = userRepository.create({
        email,
        password: '', // Password not required for Google-authenticated users
        googleId,
      });
      await userRepository.save(user);
    }

    // Generate a JWT for the authenticated user
    const jwtToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    res.status(200).json({ token: jwtToken, message: 'Login successful.' });
  } catch (error) {
    console.error('Error with Google authentication:', error);
    res.status(500).json({ error: 'Internal server error during Google authentication.' });
  }
}; */

export const googleAuth = async (req: Request, res: Response): Promise<Response> => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(400).json({ error: 'ID token is required' });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    // Process user data from payload
    return res.status(200).json({ message: 'Authentication successful', user: payload });
  } catch (error) {
    console.error('Error with Google authentication:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};


