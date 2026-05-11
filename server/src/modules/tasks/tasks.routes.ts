import { Router } from "express";
import { authenticate, requireAdmin, requireMember } from "../../middleware/auth.js";
import { getTasks, createTask, getTask, updateTask, deleteTask } from "./tasks.controller.js";

const router = Router({ mergeParams: true });

router.use(authenticate, requireMember);

router.get("/",          getTasks);
router.post("/",         requireAdmin, createTask);
router.get("/:taskId",   getTask);
router.patch("/:taskId", updateTask);
router.delete("/:taskId", requireAdmin, deleteTask);

export default router;