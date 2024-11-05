import express from "express";
import { addTask, removeTask } from "../controllers/tasksController.js";

const router = express.Router();

router.post("/add-task", addTask);
router.post("/remove-task", removeTask);

export default router;
