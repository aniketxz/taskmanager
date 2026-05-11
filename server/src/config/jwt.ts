import jwt, { type Secret, type SignOptions } from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;

const EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"];

if (!SECRET) {
	throw new Error("JWT_SECRET is not set in environment variables");
}

const secret = SECRET as Secret;

export interface JwtPayload {
	userId: string;
}

export function signToken(payload: JwtPayload): string {
	return jwt.sign(payload, secret, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
	return jwt.verify(token, secret) as JwtPayload;
}
