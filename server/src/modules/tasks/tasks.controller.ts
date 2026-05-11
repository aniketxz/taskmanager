import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../db/index.js";
import { tasks, users } from "../../db/schema.js";
import { Request, Response } from "express";


const taskSchema = z.object({
  title:       z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional(),
  dueDate:     z.string().datetime().optional().nullable(),
  priority:    z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  status:      z.enum(["TODO", "IN_PROGRESS", "DONE"]).default("TODO"),
  assignedTo:  z.string().uuid().optional().nullable(),
});

// GET /projects/:projectId/tasks
export const getTasks = async (req: any, res: Response): Promise<any> => {
  try {
    const projectId  = req.params.projectId  as string;
    const status     = req.query.status      as string | undefined;
    const priority   = req.query.priority    as string | undefined;
    const assignedTo = req.query.assignedTo  as string | undefined;

    const conditions = [eq(tasks.projectId, projectId)];
    if (status)     conditions.push(eq(tasks.status,    status     as "TODO" | "IN_PROGRESS" | "DONE"));
    if (priority)   conditions.push(eq(tasks.priority,  priority   as "LOW" | "MEDIUM" | "HIGH"));
    if (assignedTo) conditions.push(eq(tasks.assignedTo, assignedTo));

    const rows = await db
      .select({
        task:     tasks,
        assignee: { id: users.id, name: users.name, email: users.email },
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.assignedTo, users.id))
      .where(and(...conditions));

    res.json({ tasks: rows });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

// POST /projects/:projectId/tasks
export const createTask = async (req: any, res: Response): Promise<any> => {
  try {
    const projectId = req.params.projectId as string;
    const data = taskSchema.parse(req.body);

    const [task] = await db
      .insert(tasks)
      .values({
        title:       data.title,
        description: data.description,
        priority:    data.priority,
        status:      data.status,
        assignedTo:  data.assignedTo ?? null,
        dueDate:     data.dueDate ? new Date(data.dueDate) : null,
        projectId,
        createdBy:   req.user.id,
      })
      .returning();

    res.status(201).json({ task });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Validation failed", issues: error.errors });
    }
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

// GET /projects/:projectId/tasks/:taskId
export const getTask = async (req: any, res: Response): Promise<any> => {
  try {
    const taskId    = req.params.taskId    as string;
    const projectId = req.params.projectId as string;

    const [row] = await db
      .select({
        task:     tasks,
        assignee: { id: users.id, name: users.name, email: users.email },
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.assignedTo, users.id))
      .where(and(eq(tasks.id, taskId), eq(tasks.projectId, projectId)))
      .limit(1);

    if (!row) return res.status(404).json({ error: "Task not found" });

    res.json(row);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

// PATCH /projects/:projectId/tasks/:taskId
export const updateTask = async (req: any, res: Response): Promise<any> => {
  try {
    const taskId    = req.params.taskId    as string;
    const projectId = req.params.projectId as string;
    const isAdmin   = req.membership.role === "ADMIN";

    // Build update payload
    let setData: {
      title?:       string;
      description?: string;
      dueDate?:     Date | null;
      priority?:    "LOW" | "MEDIUM" | "HIGH";
      status?:      "TODO" | "IN_PROGRESS" | "DONE";
      assignedTo?:  string | null;
      updatedAt:    Date;
    };

    if (isAdmin) {
      const parsed = taskSchema.partial().parse(req.body);
      setData = {
        ...parsed,
        dueDate:   parsed.dueDate !== undefined ? (parsed.dueDate ? new Date(parsed.dueDate) : null) : undefined,
        updatedAt: new Date(),
      };
    } else {
      // Members update status
      const [task] = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, taskId), eq(tasks.projectId, projectId)))
        .limit(1);

      if (!task) return res.status(404).json({ error: "Task not found" });
      if (task.assignedTo !== req.user.id) {
        return res.status(403).json({ error: "You can only update tasks assigned to you" });
      }

      const { status } = z.object({ status: z.enum(["TODO", "IN_PROGRESS", "DONE"]) }).parse(req.body);
      setData = { status, updatedAt: new Date() };
    }

    const [updated] = await db
      .update(tasks)
      .set(setData)
      .where(and(eq(tasks.id, taskId), eq(tasks.projectId, projectId)))
      .returning();

    if (!updated) return res.status(404).json({ error: "Task not found" });

    res.json({ task: updated });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Validation failed", issues: error.errors });
    }
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

// DELETE /projects/:projectId/tasks/:taskId
export const deleteTask = async (req: any, res: Response): Promise<any> => {
  try {
    const taskId    = req.params.taskId    as string;
    const projectId = req.params.projectId as string;

    await db
      .delete(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.projectId, projectId)));

    res.json({ message: "Task deleted" });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};