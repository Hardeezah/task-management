import express, { Request, Response } from 'express';
import {
  registerUser,
  verifyOTPAndCreateUser,
  loginUser,
  initiatePasswordReset,
  verifyPasswordResetOTP,
  updatePassword,

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

router.post('/password-reset', async (req: Request, res: Response) => {
  try {
    await initiatePasswordReset(req, res);
  } catch (error) {
    // Handle error
  }
});

router.post('/password-reset/verify-email', async (req: Request, res: Response) => {
  try {
    await verifyPasswordResetOTP(req, res);
  } catch (error) {
    // Handle error
  }
});
router.post('/password-reset/update/:email', async (req: Request, res: Response) => {
  try {
    await updatePassword(req, res);
  } catch (error) {
    // Handle error
  }
});
export default router;