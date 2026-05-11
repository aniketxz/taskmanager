import { eq, and, lt, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { tasks, projects, projectMembers, users } from "../../db/schema.js";
import { Request, Response } from "express";

// GET /dashboard
export const getDashboard = async (req: any, res: Response): Promise<any> => {
  try {
    const userId = req.user.id;

    // User projectIds
    const memberships = await db
      .select({ projectId: projectMembers.projectId, role: projectMembers.role })
      .from(projectMembers)
      .where(eq(projectMembers.userId, userId));

    const projectIds = memberships.map((m) => m.projectId);

    if (projectIds.length === 0) {
      return res.json({
        totalTasks:   0,
        byStatus:     { TODO: 0, IN_PROGRESS: 0, DONE: 0 },
        byPriority:   { LOW: 0, MEDIUM: 0, HIGH: 0 },
        overdueTasks: 0,
        myTasks:      0,
        tasksByUser:  [],
        projects:     [],
      });
    }

    const now = new Date();

    // User tasks
    const allTasks = await db
      .select()
      .from(tasks)
      .where(sql`${tasks.projectId} = ANY(${sql`ARRAY[${sql.join(projectIds.map(id => sql`${id}::uuid`), sql`, `)}]`})`);


    const byStatus   = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
    const byPriority = { LOW: 0, MEDIUM: 0, HIGH: 0 };
    let overdueTasks = 0;
    let myTasks      = 0;
    const assigneeMap: Record<string, number> = {};

    for (const task of allTasks) {
      byStatus[task.status]++;
      byPriority[task.priority]++;
      if (task.dueDate && task.dueDate < now && task.status !== "DONE") overdueTasks++;
      if (task.assignedTo === userId) myTasks++;
      if (task.assignedTo) {
        assigneeMap[task.assignedTo] = (assigneeMap[task.assignedTo] || 0) + 1;
      }
    }

    // Assignee names
    const assigneeIds = Object.keys(assigneeMap);
    let tasksByUser: { userId: string; name: string; count: number }[] = [];
    if (assigneeIds.length > 0) {
      const assigneeUsers = await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(sql`${users.id} = ANY(${sql`ARRAY[${sql.join(assigneeIds.map(id => sql`${id}::uuid`), sql`, `)}]`})`);

      tasksByUser = assigneeUsers.map((u) => ({
        userId: u.id,
        name:   u.name,
        count:  assigneeMap[u.id] || 0,
      }));
    }

    // Project summaries
    const projectRows = await db
      .select({ id: projects.id, name: projects.name })
      .from(projects)
      .where(sql`${projects.id} = ANY(${sql`ARRAY[${sql.join(projectIds.map(id => sql`${id}::uuid`), sql`, `)}]`})`);

    res.json({
      totalTasks: allTasks.length,
      byStatus,
      byPriority,
      overdueTasks,
      myTasks,
      tasksByUser,
      projects: projectRows,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};