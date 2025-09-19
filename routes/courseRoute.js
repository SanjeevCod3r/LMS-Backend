import express from "express";

import { getAllCourse, getCourseId, updateCourse, deleteCourse } from "../controllers/courseController.js";

const courseRouter = express.Router();

courseRouter.get("/all", getAllCourse);
courseRouter.get("/:id", getCourseId);
courseRouter.delete("/:id", deleteCourse);
courseRouter.put("/:id", updateCourse);

export default courseRouter;
