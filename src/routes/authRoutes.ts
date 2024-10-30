import express, { Request, Response } from 'express';
import {
  registerUser,
  verifyOTPAndCreateUser,
  loginUser,

} from '../controllers/authController';

const router = express.Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    await registerUser(req, res);
  } catch (error) {
    // Handle error
  }
});

router.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    await verifyOTPAndCreateUser(req, res);
  } catch (error) {
    // Handle error
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    await loginUser(req, res);
  } catch (error) {
    // Handle error
  }
});
export default router;