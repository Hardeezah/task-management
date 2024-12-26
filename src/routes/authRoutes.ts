import express, { Request, Response } from 'express';
import {
  registerUser,
  verifyOTPAndCreateUser,
  loginUser,
  initiatePasswordReset,
  verifyPasswordResetOTP,
  updatePassword,
  changePassword,
  googleAuth,

} from '../controllers/authController';
import { validateRequest } from '../middlewares/validateRequest';
import { changePasswordSchema } from '../validators/taskValidators';

const router = express.Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    await registerUser(req, res);
  } catch (error) {
    // Handle error
  }
});

router.post('/auth/google', async (req: Request, res: Response) => {
  try {
    await googleAuth(req, res);
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

router.post('/change-password', validateRequest(changePasswordSchema), async (req: Request, res: Response) => {
  try {
    await changePassword(req, res);
  } catch (error: any) {
    console.log(error.message);
    
  }
});

export default router;