import express from 'express';
import { 
    register, 
    login, 
    getProfile, 
    updateProfile, 
    changePassword, 
    logout 
} from '../controllers/authController.js';
import { authenticateToken } from '../middlewares/auth.js';

const authRouter = express.Router();

// Public routes
authRouter.post('/register', register);
authRouter.post('/login', login);

// Protected routes (require authentication)
authRouter.get('/profile', authenticateToken, getProfile);
authRouter.put('/profile', authenticateToken, updateProfile);
authRouter.put('/change-password', authenticateToken, changePassword);
authRouter.post('/logout', authenticateToken, logout);

export default authRouter;
