"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const validateRequest_1 = require("../middlewares/validateRequest");
const taskValidators_1 = require("../validators/taskValidators");
const router = express_1.default.Router();
router.post('/register', async (req, res) => {
    try {
        await (0, authController_1.registerUser)(req, res);
    }
    catch (error) {
        // Handle error
    }
});
router.post('/auth/google', async (req, res) => {
    try {
        await (0, authController_1.googleAuth)(req, res);
    }
    catch (error) {
        // Handle error
    }
});
router.post('/verify-otp', async (req, res) => {
    try {
        await (0, authController_1.verifyOTPAndCreateUser)(req, res);
    }
    catch (error) {
        // Handle error
    }
});
router.post('/login', async (req, res) => {
    try {
        await (0, authController_1.loginUser)(req, res);
    }
    catch (error) {
        // Handle error
    }
});
router.post('/password-reset', async (req, res) => {
    try {
        await (0, authController_1.initiatePasswordReset)(req, res);
    }
    catch (error) {
        // Handle error
    }
});
router.post('/password-reset/verify-email', async (req, res) => {
    try {
        await (0, authController_1.verifyPasswordResetOTP)(req, res);
    }
    catch (error) {
        // Handle error
    }
});
router.post('/password-reset/update/:email', async (req, res) => {
    try {
        await (0, authController_1.updatePassword)(req, res);
    }
    catch (error) {
        // Handle error
    }
});
router.post('/change-password', (0, validateRequest_1.validateRequest)(taskValidators_1.changePasswordSchema), async (req, res) => {
    try {
        await (0, authController_1.changePassword)(req, res);
    }
    catch (error) {
        console.log(error.message);
    }
});
exports.default = router;
//# sourceMappingURL=authRoutes.js.map