"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleAuth = exports.changePassword = exports.updatePassword = exports.verifyPasswordResetOTP = exports.initiatePasswordReset = exports.loginUser = exports.verifyOTPAndCreateUser = exports.registerUser = void 0;
const redisClient_1 = require("../database/redisClient");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const email_1 = require("../utils/email");
const otp_1 = require("../utils/otp");
const data_source_1 = require("../database/data-source");
const User_1 = require("../models/User");
const google_auth_library_1 = require("google-auth-library");
const userRepository = data_source_1.AppDataSource.getRepository(User_1.User);
// Register User and Send OTP
const registerUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Check if the email already exists in the main database
        const existingUser = await userRepository.findOneBy({ email });
        if (existingUser) {
            console.log(`Registration attempt for existing email: ${email}`);
            return res.status(400).json({ message: 'Account already exists.' });
        }
        // Check if an OTP is already sent and waiting for verification
        const existingOTP = await redisClient_1.redisClient.get(`otp:${email}`);
        if (existingOTP) {
            console.log(`OTP for ${email} already exists: ${existingOTP}`);
            return res.status(400).json({ message: 'OTP already sent. Please verify.' });
        }
        // Hash the password and generate an OTP
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const otp = (0, otp_1.generateOTP)();
        // Store the OTP and user data in Redis with a 5-minute TTL
        await redisClient_1.redisClient.set(`otp:${email}`, JSON.stringify({ email, password: hashedPassword, otp }), { ex: 900 } // 5 mins 
        );
        console.log(`OTP for ${email}: ${otp}`);
        // Send OTP to the user's email
        await (0, email_1.sendOTP)(email, otp);
        return res.status(200).json({ message: 'OTP sent. Please verify to complete registration.' });
    }
    catch (error) {
        console.error('Error during registration:', error);
        return res.status(500).json({ error: 'Internal server error during registration.' });
    }
};
exports.registerUser = registerUser;
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
const verifyOTPAndCreateUser = async (req, res) => {
    try {
        const { email, otp } = req.body;
        // Retrieve data from Redis
        const userData = await redisClient_1.redisClient.get(`otp:${email}`);
        console.log('Raw userData from Redis:', userData);
        // Handle both string and object formats
        let parsedData;
        if (typeof userData === 'string') {
            parsedData = JSON.parse(userData);
        }
        else if (typeof userData === 'object' && userData !== null) {
            parsedData = userData;
        }
        else {
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
        await redisClient_1.redisClient.del(`otp:${email}`);
        console.log(`User ${email} registered successfully.`);
        return res.status(201).json({ message: 'User registered successfully.' });
    }
    catch (error) {
        console.error('Error during OTP verification:', error);
        return res.status(500).json({ error: 'Internal server error during OTP verification.' });
    }
};
exports.verifyOTPAndCreateUser = verifyOTPAndCreateUser;
// Login User and Generate JWT
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userRepository.findOneBy({ email });
        if (!user) {
            console.error(`Login failed for ${email}: User not found.`);
            return res.status(400).json({ error: 'Invalid email or password.' });
        }
        const isPasswordValid = user.password && await bcrypt_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            console.error(`Login failed for ${email}: Invalid password.`);
            return res.status(400).json({ error: 'Invalid email or password.' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        console.log(`User ${email} logged in successfully.`);
        return res.status(200).json({ token });
    }
    catch (error) {
        console.error('Error during login:', error);
        return res.status(500).json({ error: 'Internal server error during login.' });
    }
};
exports.loginUser = loginUser;
// Initiate Password Reset with OTP
const initiatePasswordReset = async (req, res) => {
    try {
        const { email } = req.body;
        // Check if the email exists in the database
        const user = await userRepository.findOneBy({ email });
        if (!user) {
            return res.status(400).json({ message: 'User with this email does not exist.' });
        }
        // Check if OTP is already sent
        const existingOTP = await redisClient_1.redisClient.get(`password-reset-otp:${email}`);
        if (existingOTP) {
            return res.status(400).json({ message: 'OTP already sent. Please verify to reset your password.' });
        }
        // Generate OTP and store in Redis with a 10-minute TTL
        const otp = (0, otp_1.generateOTP)();
        await redisClient_1.redisClient.set(`password-reset-otp:${email}`, JSON.stringify({ otp }), { ex: 600 }); // 10 mins TTL
        console.log(redisClient_1.redisClient);
        console.log(`OTP for ${email}: ${otp}`);
        await (0, email_1.sendOTP)(email, otp);
        return res.status(200).json({ message: 'Password reset OTP sent. Please verify to proceed.' });
    }
    catch (error) {
        console.error('Error during password reset initiation:', error);
        return res.status(500).json({ error: 'Internal server error during password reset initiation.' });
    }
};
exports.initiatePasswordReset = initiatePasswordReset;
// Verify OTP and Set Verified Status
const verifyPasswordResetOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        // Retrieve OTP from Redis
        const otpData = await redisClient_1.redisClient.get(`password-reset-otp:${email}`);
        if (!otpData) {
            return res.status(400).json({ error: 'OTP expired or invalid.' });
        }
        const parsedData = JSON.parse(otpData);
        if (parsedData.otp !== otp) {
            return res.status(400).json({ error: 'Invalid OTP.' });
        }
        // Set verified flag in Redis after successful OTP verification and delete OTP
        await redisClient_1.redisClient.del(`password-reset-otp:${email}`);
        await redisClient_1.redisClient.set(`verified:${email}`, JSON.stringify({ verified: true }), { ex: 600 }); // Verified for 10 mins
        console.log(redisClient_1.redisClient);
        return res.status(200).json({ message: 'OTP verified successfully. You may now reset your password.' });
    }
    catch (error) {
        console.error('Error during OTP verification:', error);
        return res.status(500).json({ error: 'Internal server error during OTP verification.' });
    }
};
exports.verifyPasswordResetOTP = verifyPasswordResetOTP;
// Update Password for Verified User
const updatePassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        const { email } = req.params;
        // Check if the verified status exists in Redis
        const verificationData = await redisClient_1.redisClient.get(`verified:${email}`);
        if (!verificationData) {
            return res.status(400).json({ message: 'Email not verified or verification expired. Please request a new OTP.' });
        }
        const parsedData = JSON.parse(verificationData);
        if (!parsedData.verified) {
            return res.status(400).json({ message: 'Email verification is required to reset password.' });
        }
        // Find the user in the database
        const user = await userRepository.findOneBy({ email });
        if (!user) {
            return res.status(400).json({ message: 'User with this email does not exist.' });
        }
        // Hash and update the new password
        const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
        user.password = hashedPassword;
        await userRepository.save(user);
        // Clean up the verified flag from Redis after password reset
        await redisClient_1.redisClient.del(`verified:${email}`);
        return res.status(200).json({ message: 'Password reset successfully.' });
    }
    catch (error) {
        console.error('Error during password reset:', error);
        return res.status(500).json({ error: 'Internal server error during password reset.' });
    }
};
exports.updatePassword = updatePassword;
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        // Extract token from headers
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ error: 'Authorization token missing.' });
        }
        // Verify and decode the token to get user email
        const decodedToken = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const userEmail = decodedToken.email;
        // Find user by email
        const user = await userRepository.findOneBy({ email: userEmail });
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        // Check if the current password matches the stored password
        const isPasswordValid = user.password && await bcrypt_1.default.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Current password is incorrect or not set.' });
        }
        if (currentPassword === user.password) {
            return res.status(400).json({ error: 'Current password cannot be the same as the new password.' });
        }
        // Hash the new password
        const hashedNewPassword = await bcrypt_1.default.hash(newPassword, 10);
        // Update user's password in the database
        user.password = hashedNewPassword;
        await userRepository.save(user);
        return res.status(200).json({ message: 'Password changed successfully.' });
    }
    catch (error) {
        console.error('Error during password change:', error);
        return res.status(500).json({ error: 'Internal server error during password change.' });
    }
};
exports.changePassword = changePassword;
const client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
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
const googleAuth = async (req, res) => {
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
    }
    catch (error) {
        console.error('Error with Google authentication:', error);
        return res.status(500).json({ error: 'Authentication failed' });
    }
};
exports.googleAuth = googleAuth;
//# sourceMappingURL=authController.js.map