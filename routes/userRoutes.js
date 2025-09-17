import express from "express";
import { addUserRating, getUserCourseProgress, getUserData, purchaseCourse, updateUserCourseProgress, userEnrolledCourses } from "../controllers/userController.js";
import { authenticateToken } from "../middlewares/auth.js";

const userRouter = express.Router();

// All user routes require authentication
userRouter.get('/data', authenticateToken, getUserData);
userRouter.get('/enrolled-courses', authenticateToken, userEnrolledCourses);
userRouter.post('/purchase', authenticateToken, purchaseCourse);
userRouter.post('/update-course-progress', authenticateToken, updateUserCourseProgress);
userRouter.post('/get-course-progress', authenticateToken, getUserCourseProgress);
userRouter.post('/add-rating', authenticateToken, addUserRating);

export default userRouter;