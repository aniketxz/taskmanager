import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import "dotenv/config";

import authRoutes from "./modules/auth/auth.routes.js";
import projectRoutes from "./modules/projects/project.routes.js";
import taskRoutes from "./modules/tasks/tasks.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";


const app = express();


app.use(helmet());
app.use(
	cors({
		origin: process.env.CLIENT_URL || "http://localhost:3000",
		credentials: true,
	}),
);
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));


app.get("/health", (_, res) =>
	res.json({ status: "ok", timestamp: new Date().toISOString() }),
);

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/projects", projectRoutes);

app.use("/api/projects/:projectId/tasks", taskRoutes);


app.use((req, res) => {
	res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

export default app;
