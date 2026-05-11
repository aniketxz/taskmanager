import "express";

declare global {
	namespace Express {
		interface Request {
			user: {
				id: string;
				name: string;
				email: string;
			};
			membership: {
				id: string;
				projectId: string;
				userId: string;
				role: "ADMIN" | "MEMBER";
				joinedAt: Date;
			};
		}
	}
}
