import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../db/index.js";
import { projects, projectMembers, users } from "../../db/schema.js";
import { Request, Response } from "express";


const projectSchema = z.object({
	name: z.string().min(1, "Project name is required").max(100),
	description: z.string().max(500).optional(),
});

const addMemberSchema = z.object({
	email: z.string().email("Invalid email"),
	role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

// GET /projects
export const getProjects = async (req: any, res: Response): Promise<any> => {
	try {
		const memberships = await db
			.select({
				project: projects,
				role: projectMembers.role,
			})
			.from(projectMembers)
			.innerJoin(projects, eq(projectMembers.projectId, projects.id))
			.where(eq(projectMembers.userId, req.user.id));

		res.json({ projects: memberships });
	} catch (error: any) {
		res.status(500).json({ error: error.message || "Internal server error" });
	}
};

// POST /projects
export const createProject = async (req: any, res: Response): Promise<any> => {
	try {
		const { name, description } = projectSchema.parse(req.body);

		const [project] = await db
			.insert(projects)
			.values({ name, description, createdBy: req.user.id })
			.returning();

		await db.insert(projectMembers).values({
			projectId: project.id,
			userId: req.user.id,
			role: "ADMIN",
		});

		res.status(201).json({ project });
	} catch (error: any) {
		if (error.name === "ZodError") {
			return res.status(400).json({ error: "Validation failed", issues: error.errors });
		}
		res.status(500).json({ error: error.message || "Internal server error" });
	}
};

// GET /projects/:projectId
export const getProject = async (req: any, res: Response): Promise<any> => {
	try {
		const projectId = req.params.projectId as string;

		const [project] = await db
			.select()
			.from(projects)
			.where(eq(projects.id, projectId))
			.limit(1);

		if (!project) return res.status(404).json({ error: "Project not found" });

		const members = await db
			.select({
				id: users.id,
				name: users.name,
				email: users.email,
				role: projectMembers.role,
				joinedAt: projectMembers.joinedAt,
			})
			.from(projectMembers)
			.innerJoin(users, eq(projectMembers.userId, users.id))
			.where(eq(projectMembers.projectId, projectId));

		res.json({ project, members });
	} catch (error: any) {
		res.status(500).json({ error: error.message || "Internal server error" });
	}
};

// PATCH /projects/:projectId
export const updateProject = async (req: any, res: Response): Promise<any> => {
	try {
		const projectId = req.params.projectId as string;
		const data = projectSchema.partial().parse(req.body);

		const [updated] = await db
			.update(projects)
			.set(data)
			.where(eq(projects.id, projectId))
			.returning();

		res.json({ project: updated });
	} catch (error: any) {
		if (error.name === "ZodError") {
			return res.status(400).json({ error: "Validation failed", issues: error.errors });
		}
		res.status(500).json({ error: error.message || "Internal server error" });
	}
};

// DELETE /projects/:projectId
export const deleteProject = async (req: any, res: Response): Promise<any> => {
	try {
		const projectId = req.params.projectId as string;
		await db.delete(projects).where(eq(projects.id, projectId));
		res.json({ message: "Project deleted" });
	} catch (error: any) {
		res.status(500).json({ error: error.message || "Internal server error" });
	}
};

// POST /projects/:projectId/members
export const addMember = async (req: any, res: Response): Promise<any> => {
	try {
		const projectId = req.params.projectId as string;
		const { email, role } = addMemberSchema.parse(req.body);

		const [userToAdd] = await db
			.select({ id: users.id, name: users.name, email: users.email })
			.from(users)
			.where(eq(users.email, email))
			.limit(1);

		if (!userToAdd) {
			return res.status(404).json({ error: "No user found with that email" });
		}

		const [existing] = await db
			.select()
			.from(projectMembers)
			.where(
				and(
					eq(projectMembers.projectId, projectId),
					eq(projectMembers.userId, userToAdd.id),
				),
			)
			.limit(1);

		if (existing) {
			return res
				.status(409)
				.json({ error: "User is already a member of this project" });
		}

		await db
			.insert(projectMembers)
			.values({ projectId, userId: userToAdd.id, role });

		res.status(201).json({ message: "Member added", user: userToAdd, role });
	} catch (error: any) {
		if (error.name === "ZodError") {
			return res.status(400).json({ error: "Validation failed", issues: error.errors });
		}
		if (error.code === "23505") {
			return res.status(409).json({ error: "A record with this value already exists" });
		}
		res.status(500).json({ error: error.message || "Internal server error" });
	}
};

// DELETE /projects/:projectId/members/:userId
export const removeMember = async (req: any, res: Response): Promise<any> => {
	try {
		const projectId = req.params.projectId as string;
		const userId    = req.params.userId    as string;

		if (userId === req.user.id) {
			return res
				.status(400)
				.json({ error: "You cannot remove yourself from the project" });
		}

		await db
			.delete(projectMembers)
			.where(
				and(
					eq(projectMembers.projectId, projectId),
					eq(projectMembers.userId, userId),
				),
			);

		res.json({ message: "Member removed" });
	} catch (error: any) {
		res.status(500).json({ error: error.message || "Internal server error" });
	}
};
