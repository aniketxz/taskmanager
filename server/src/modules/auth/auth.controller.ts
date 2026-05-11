import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { signToken } from "../../config/jwt.js";
import { Request, Response } from "express";


const signupSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters"),
	email: z.string().email("Invalid email address"),
	password: z.string().min(6, "Password must be at least 6 characters"),
});

const loginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(1, "Password is required"),
});


function buildUserResponse(
	user: { id: string; name: string; email: string },
	token: string,
) {
	return {
		token,
		user: { id: user.id, name: user.name, email: user.email },
	};
}


export const signup = async (req: Request, res: Response): Promise<any> => {
	try {
		const { name, email, password } = signupSchema.parse(req.body);

		const [existing] = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.email, email))
			.limit(1);

		if (existing) {
			return res.status(409).json({ error: "Email already in use" });
		}

		const passwordHash = await bcrypt.hash(password, 12);

		const [user] = await db
			.insert(users)
			.values({ name, email, passwordHash })
			.returning({ id: users.id, name: users.name, email: users.email });

		const token = signToken({ userId: user.id });

		res.status(201).json(buildUserResponse(user, token));
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

export const login = async (req: Request, res: Response): Promise<any> => {
	try {
		const { email, password } = loginSchema.parse(req.body);

		const [user] = await db
			.select()
			.from(users)
			.where(eq(users.email, email))
			.limit(1);

		if (!user) {
			return res.status(401).json({ error: "Invalid email or password" });
		}

		const passwordMatch = await bcrypt.compare(password, user.passwordHash);

		if (!passwordMatch) {
			return res.status(401).json({ error: "Invalid email or password" });
		}

		const token = signToken({ userId: user.id });

		res.json(buildUserResponse(user, token));
	} catch (error: any) {
		if (error.name === "ZodError") {
			return res.status(400).json({ error: "Validation failed", issues: error.errors });
		}
		res.status(500).json({ error: error.message || "Internal server error" });
	}
};

export const getMe = async (req: any, res: Response): Promise<any> => {
	try {
		res.json({ user: req.user });
	} catch (error: any) {
		res.status(500).json({ error: error.message || "Internal server error" });
	}
};
