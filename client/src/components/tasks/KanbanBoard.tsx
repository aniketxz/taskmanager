"use client";

import { useState } from "react";
import {
	DndContext,
	DragEndEvent,
	DragOverlay,
	DragStartEvent,
	PointerSensor,
	useSensor,
	useSensors,
	pointerWithin,
	useDroppable,
	defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
	SortableContext,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "@/lib/api";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { TaskCard, type Task } from "./TaskCard";
import { TaskDetailModal } from "./TaskDetailModal";

interface Member {
	id: string;
	name: string;
	email: string;
	role: "ADMIN" | "MEMBER";
}

const COLUMNS: { id: Task["status"]; label: string }[] = [
	{ id: "TODO", label: "To do" },
	{ id: "IN_PROGRESS", label: "In progress" },
	{ id: "DONE", label: "Done" },
];

function Column({
	id,
	label,
	tasks,
	onTaskClick,
	isAdmin,
	onAddTask,
}: {
	id: string;
	label: string;
	tasks: Task[];
	onTaskClick: (task: Task) => void;
	isAdmin: boolean;
	onAddTask?: () => void;
}) {
	const { setNodeRef, isOver } = useDroppable({ id });

	return (
		<div className="flex flex-col min-h-[200px]">
			<div className="flex items-center justify-between mb-3">
				<div className="flex items-center gap-2">
					<span className="text-sm font-medium text-foreground">{label}</span>
					<span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
						{tasks.length}
					</span>
				</div>
				{isAdmin && id === "TODO" && onAddTask && (
					<button
						onClick={onAddTask}
						className="text-muted-foreground hover:text-foreground transition"
					>
						<Plus size={16} />
					</button>
				)}
			</div>

			<div
				ref={setNodeRef}
				className={`flex-1 space-y-2 min-h-[100px] rounded-md transition-colors p-1 -m-1 ${
					isOver ? "bg-accent/50" : ""
				}`}
			>
				<SortableContext
					items={tasks.map((t) => t.id)}
					strategy={verticalListSortingStrategy}
				>
					{tasks.map((task) => (
						<TaskCard
							key={task.id}
							task={task}
							onClick={() => onTaskClick(task)}
						/>
					))}
				</SortableContext>
			</div>
		</div>
	);
}

function AddTaskModal({
	projectId,
	members,
	onClose,
}: {
	projectId: string;
	members: Member[];
	onClose: () => void;
}) {
	const qc = useQueryClient();
	const [form, setForm] = useState({
		title: "",
		description: "",
		priority: "MEDIUM" as Task["priority"],
		dueDate: "",
		assignedTo: "",
	});

	const mutation = useMutation({
		mutationFn: () =>
			tasksApi.create(projectId, {
				...form,
				dueDate: form.dueDate
					? new Date(form.dueDate).toISOString()
					: undefined,
				assignedTo: form.assignedTo || undefined,
				description: form.description || undefined,
			}),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["tasks", projectId] });
			toast.success("Task created");
			onClose();
		},
		onError: () => toast.error("Failed to create task"),
	});

	return (
		<div
			className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4"
			onClick={onClose}
		>
			<div
				className="bg-card border border-border rounded-lg w-full max-w-md p-6 shadow-lg"
				onClick={(e) => e.stopPropagation()}
			>
				<h2 className="text-base font-semibold text-foreground mb-5">
					New task
				</h2>
				<div className="space-y-4">
					<div className="space-y-1">
						<label className="text-sm font-medium text-foreground">Title</label>
						<input
							value={form.title}
							onChange={(e) => setForm({ ...form, title: e.target.value })}
							placeholder="Task title"
							className="w-full px-3 py-2 rounded-md border border-border bg-input text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
						/>
					</div>
					<div className="space-y-1">
						<label className="text-sm font-medium text-foreground">
							Description{" "}
							<span className="text-muted-foreground font-normal">
								(optional)
							</span>
						</label>
						<textarea
							value={form.description}
							onChange={(e) =>
								setForm({ ...form, description: e.target.value })
							}
							rows={2}
							className="w-full px-3 py-2 rounded-md border border-border bg-input text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition resize-none"
						/>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1">
							<label className="text-sm font-medium text-foreground">
								Priority
							</label>
							<select
								value={form.priority}
								onChange={(e) =>
									setForm({
										...form,
										priority: e.target.value as Task["priority"],
									})
								}
								className="w-full px-3 py-2 rounded-md border border-border bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
							>
								<option value="LOW">Low</option>
								<option value="MEDIUM">Medium</option>
								<option value="HIGH">High</option>
							</select>
						</div>
						<div className="space-y-1">
							<label className="text-sm font-medium text-foreground">
								Due date
							</label>
							<input
								type="date"
								value={form.dueDate}
								onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
								className="w-full px-3 py-2 rounded-md border border-border bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
							/>
						</div>
					</div>
					<div className="space-y-1">
						<label className="text-sm font-medium text-foreground">
							Assign to
						</label>
						<select
							value={form.assignedTo}
							onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
							className="w-full px-3 py-2 rounded-md border border-border bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
						>
							<option value="">Unassigned</option>
							{members.map((m) => (
								<option key={m.id} value={m.id}>
									{m.name}
								</option>
							))}
						</select>
					</div>
				</div>
				<div className="flex gap-2 mt-6">
					<button
						onClick={onClose}
						className="flex-1 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition"
					>
						Cancel
					</button>
					<button
						onClick={() => mutation.mutate()}
						disabled={!form.title.trim() || mutation.isPending}
						className="flex-1 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition disabled:opacity-60"
					>
						{mutation.isPending ? "Creating..." : "Create"}
					</button>
				</div>
			</div>
		</div>
	);
}

export function KanbanBoard({
	tasks,
	projectId,
	userRole,
	currentUserId,
	members,
}: {
	tasks: Task[];
	projectId: string;
	userRole: "ADMIN" | "MEMBER";
	currentUserId: string;
	members: Member[];
}) {
	const qc = useQueryClient();
	const [activeTask, setActiveTask] = useState<Task | null>(null);
	const [selectedTask, setSelectedTask] = useState<Task | null>(null);
	const [showAddTask, setShowAddTask] = useState(false);
	const isAdmin = userRole === "ADMIN";

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
	);

	const updateMutation = useMutation({
		mutationFn: ({
			taskId,
			status,
		}: {
			taskId: string;
			status: Task["status"];
		}) => tasksApi.update(projectId, taskId, { status }),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks", projectId] }),
		onError: () => toast.error("Failed to move task"),
	});

	const grouped = COLUMNS.reduce(
		(acc, col) => {
			acc[col.id] = tasks.filter((t) => t.status === col.id);
			return acc;
		},
		{} as Record<Task["status"], Task[]>,
	);

	const handleDragStart = (e: DragStartEvent) => {
		const task = tasks.find((t) => t.id === e.active.id);
		if (task) setActiveTask(task);
	};

	const handleDragEnd = (e: DragEndEvent) => {
		setActiveTask(null);
		const { active, over } = e;
		if (!over) return;

		const task = tasks.find((t) => t.id === active.id);
		if (!task) return;

		if (!isAdmin && task.assignedTo !== currentUserId) return;

		const validColumn = COLUMNS.find((c) => c.id === over.id);
		if (!validColumn || task.status === over.id) return;

		updateMutation.mutate({
			taskId: task.id,
			status: over.id as Task["status"],
		});
	};

	return (
		<>
			<DndContext
				sensors={sensors}
				collisionDetection={pointerWithin}
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
			>
				<div className="grid grid-cols-3 gap-6">
					{COLUMNS.map((col) => (
						<Column
							key={col.id}
							id={col.id}
							label={col.label}
							tasks={grouped[col.id]}
							onTaskClick={setSelectedTask}
							isAdmin={isAdmin}
							onAddTask={() => setShowAddTask(true)}
						/>
					))}
				</div>

				<DragOverlay dropAnimation={null}>
					{activeTask && (
						<div className="opacity-90 rotate-1 shadow-xl">
							<TaskCard task={activeTask} onClick={() => {}} />
						</div>
					)}
				</DragOverlay>
			</DndContext>

			{selectedTask && (
				<TaskDetailModal
					task={selectedTask}
					projectId={projectId}
					userRole={userRole}
					currentUserId={currentUserId}
					members={members}
					onClose={() => setSelectedTask(null)}
				/>
			)}

			{showAddTask && (
				<AddTaskModal
					projectId={projectId}
					members={members}
					onClose={() => setShowAddTask(false)}
				/>
			)}
		</>
	);
}
