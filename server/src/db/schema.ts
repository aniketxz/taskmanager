import { pgTable, uuid, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";


export const roleEnum = pgEnum("role", ["ADMIN", "MEMBER"]);
export const priorityEnum = pgEnum("priority", ["LOW", "MEDIUM", "HIGH"]);
export const statusEnum = pgEnum("status", ["TODO", "IN_PROGRESS", "DONE"]);


export const users = pgTable("users", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	passwordHash: text("password_hash").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	description: text("description"),
	createdBy: uuid("created_by")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projectMembers = pgTable("project_members", {
	id: uuid("id").primaryKey().defaultRandom(),
	projectId: uuid("project_id")
		.notNull()
		.references(() => projects.id, { onDelete: "cascade" }),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	role: roleEnum("role").notNull().default("MEMBER"),
	joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
	id: uuid("id").primaryKey().defaultRandom(),
	title: text("title").notNull(),
	description: text("description"),
	dueDate: timestamp("due_date"),
	priority: priorityEnum("priority").notNull().default("MEDIUM"),
	status: statusEnum("status").notNull().default("TODO"),
	projectId: uuid("project_id")
		.notNull()
		.references(() => projects.id, { onDelete: "cascade" }),
	assignedTo: uuid("assigned_to").references(() => users.id, {
		onDelete: "set null",
	}),
	createdBy: uuid("created_by")
		.notNull()
		.references(() => users.id),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});


export const usersRelations = relations(users, ({ many }) => ({
	projects: many(projects),
	projectMembers: many(projectMembers),
	assignedTasks: many(tasks, { relationName: "assignedTasks" }),
	createdTasks: many(tasks, { relationName: "createdTasks" }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
	creator: one(users, { fields: [projects.createdBy], references: [users.id] }),
	members: many(projectMembers),
	tasks: many(tasks),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
	project: one(projects, {
		fields: [projectMembers.projectId],
		references: [projects.id],
	}),
	user: one(users, { fields: [projectMembers.userId], references: [users.id] }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
	project: one(projects, {
		fields: [tasks.projectId],
		references: [projects.id],
	}),
	assignee: one(users, {
		fields: [tasks.assignedTo],
		references: [users.id],
		relationName: "assignedTasks",
	}),
	creator: one(users, {
		fields: [tasks.createdBy],
		references: [users.id],
		relationName: "createdTasks",
	}),
}));
