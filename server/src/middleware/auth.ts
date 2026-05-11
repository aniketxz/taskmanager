import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../config/jwt.js";
import { db } from "../db/index.js";
import { users, projectMembers } from "../db/schema.js";
import { eq, and } from "drizzle-orm";

// Verify JWT
export async function authenticate(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	const authHeader = req.headers.authorization;

	if (!authHeader?.startsWith("Bearer ")) {
		return res
			.status(401)
			.json({ error: "Missing or invalid authorization header" });
	}

	const token = authHeader.split(" ")[1];

	try {
		const payload = verifyToken(token);

		const [user] = await db
			.select({ id: users.id, name: users.name, email: users.email })
			.from(users)
			.where(eq(users.id, payload.userId))
			.limit(1);

		if (!user) {
			return res.status(401).json({ error: "User not found" });
		}

		req.user = user;
		next();
	} catch {
		return res.status(401).json({ error: "Invalid or expired token" });
	}
}

// Require ADMIN
export async function requireAdmin(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	const projectId = req.params.projectId as string;

	const [membership] = await db
		.select()
		.from(projectMembers)
		.where(
			and(
				eq(projectMembers.projectId, projectId),
				eq(projectMembers.userId, req.user.id),
			),
		)
		.limit(1);

	if (!membership) {
		return res
			.status(403)
			.json({ error: "You are not a member of this project" });
	}

	if (membership.role !== "ADMIN") {
		return res.status(403).json({ error: "Admin access required" });
	}

	req.membership = membership;
	next();
}

// Require MEMBER
export async function requireMember(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	const projectId = req.params.projectId as string;

	const [membership] = await db
		.select()
		.from(projectMembers)
		.where(
			and(
				eq(projectMembers.projectId, projectId),
				eq(projectMembers.userId, req.user.id),
			),
		)
		.limit(1);

	if (!membership) {
		return res
			.status(403)
			.json({ error: "You are not a member of this project" });
	}

	req.membership = membership;
	next();
}
