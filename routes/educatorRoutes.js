import express from 'express'

import { addCourse, educatorDashboardData, getEducatorCourses, getEnrolledStudentsData, updateRoleToEducator } from '../controllers/educatorController.js'
import { authenticateToken, requireRole } from '../middlewares/auth.js';
import upload from '../configs/multer.js';

const educatorRouter = express.Router()

// All routes require authentication
educatorRouter.get('/update-role', authenticateToken, updateRoleToEducator);
educatorRouter.post('/add-course', authenticateToken, requireRole(['educator', 'admin']), upload.single('image'), addCourse);
educatorRouter.get('/courses', authenticateToken, requireRole(['educator', 'admin']), getEducatorCourses);
educatorRouter.get('/dashboard', authenticateToken, requireRole(['educator', 'admin']), educatorDashboardData);
educatorRouter.get('/enrolled-students', authenticateToken, requireRole(['educator', 'admin']), getEnrolledStudentsData);

export default educatorRouter;