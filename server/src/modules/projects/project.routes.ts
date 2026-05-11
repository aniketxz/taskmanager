import { Router } from "express";
import {
	authenticate,
	requireAdmin,
	requireMember,
} from "../../middleware/auth.js";
import {
	getProjects,
	createProject,
	getProject,
	updateProject,
	deleteProject,
	addMember,
	removeMember,
} from "./projects.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", getProjects);
router.post("/", createProject);

router.get("/:projectId", requireMember, getProject);
router.patch("/:projectId", requireAdmin, updateProject);
router.delete("/:projectId", requireAdmin, deleteProject);

router.post("/:projectId/members", requireAdmin, addMember);
router.delete("/:projectId/members/:userId", requireAdmin, removeMember);

export default router;
