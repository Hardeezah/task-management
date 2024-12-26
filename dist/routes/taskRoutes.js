"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const taskController_1 = require("../controllers/taskController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const validateRequest_1 = require("../middlewares/validateRequest");
const taskValidators_1 = require("../validators/taskValidators");
const router = express_1.default.Router();
router.post('/tasks', authMiddleware_1.authMiddleware, (0, validateRequest_1.validateRequest)(taskValidators_1.createTaskSchema), taskController_1.createTask); // Create a task
//router.get('/tasks', authMiddleware, getAllTasks); // Get tasks with pagination
router.get('/tasks/:id', authMiddleware_1.authMiddleware, taskController_1.getTaskById); // Get task by ID
router.put('/tasks/:id', authMiddleware_1.authMiddleware, (0, validateRequest_1.validateRequest)(taskValidators_1.updateTaskSchema), taskController_1.updateTask); // Update task by ID
router.delete('/tasks/:id', authMiddleware_1.authMiddleware, taskController_1.deleteTask); // Delete task by ID
router.get('/tasks', authMiddleware_1.authMiddleware, taskController_1.getAllTasksWithFilters); // Get tasks with pagination
router.post('/tasks/share', authMiddleware_1.authMiddleware, taskController_1.shareTask); // Get tasks with pagination
exports.default = router;
//# sourceMappingURL=taskRoutes.js.map