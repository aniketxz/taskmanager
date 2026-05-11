"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "@/lib/api";
import { toast } from "sonner";
import { X, Trash2 } from "lucide-react";
import { format } from "date-fns";
import type { Task } from "./TaskCard";

interface Member {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
}

interface Props {
  task: Task;
  projectId: string;
  userRole: "ADMIN" | "MEMBER";
  currentUserId: string;
  members: Member[];
  onClose: () => void;
}

const STATUSES = ["TODO", "IN_PROGRESS", "DONE"] as const;
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;

export function TaskDetailModal({
  task,
  projectId,
  userRole,
  currentUserId,
  members,
  onClose,
}: Props) {
  const qc = useQueryClient();
  const isAdmin = userRole === "ADMIN";
  const isAssignedToMe = task.assignedTo === currentUserId;
  const canEdit = isAdmin || isAssignedToMe;

  const [form, setForm] = useState({
    title: task.title,
    description: task.description || "",
    priority: task.priority,
    status: task.status,
    dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
    assignedTo: task.assignedTo || "",
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<typeof form>) =>
      tasksApi.update(projectId, task.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", projectId] });
      toast.success("Task updated");
      onClose();
    },
    onError: () => toast.error("Failed to update"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => tasksApi.delete(projectId, task.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", projectId] });
      toast.success("Task deleted");
      onClose();
    },
    onError: () => toast.error("Failed to delete"),
  });

  const handleSave = () => {
    if (isAdmin) {
      updateMutation.mutate({
        title: form.title,
        description: form.description || undefined,
        priority: form.priority,
        status: form.status,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
        assignedTo: form.assignedTo || undefined,
      });
    } else {
      updateMutation.mutate({ status: form.status });
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-lg w-full max-w-md p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <h2 className="text-base font-semibold text-foreground pr-4">
            {isAdmin ? "Edit task" : "Task details"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Title
            </label>
            {isAdmin ? (
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-border bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
              />
            ) : (
              <p className="text-sm text-foreground">{task.title}</p>
            )}
          </div>

          {/* Description */}
          {isAdmin && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 rounded-md border border-border bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition resize-none"
              />
            </div>
          )}
          {!isAdmin && task.description && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Description
              </label>
              <p className="text-sm text-muted-foreground">{task.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {/* Status */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Status
              </label>
              {canEdit ? (
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as typeof form.status,
                    })
                  }
                  className="w-full px-3 py-2 rounded-md border border-border bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace("_", " ")}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-foreground">
                  {task.status.replace("_", " ")}
                </p>
              )}
            </div>

            {/* Priority */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Priority
              </label>
              {isAdmin ? (
                <select
                  value={form.priority}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      priority: e.target.value as typeof form.priority,
                    })
                  }
                  className="w-full px-3 py-2 rounded-md border border-border bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p.toLowerCase()}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-foreground">
                  {task.priority.toLowerCase()}
                </p>
              )}
            </div>
          </div>

          {/* Due date + Assignee (admin only) */}
          {isAdmin && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Due date
                </label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm({ ...form, dueDate: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-md border border-border bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Assign to
                </label>
                <select
                  value={form.assignedTo}
                  onChange={(e) =>
                    setForm({ ...form, assignedTo: e.target.value })
                  }
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
          )}

          {!isAdmin && task.dueDate && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Due date
              </label>
              <p className="text-sm text-foreground">
                {format(new Date(task.dueDate), "MMM d, yyyy")}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-6">
          {isAdmin && (
            <button
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="p-2 rounded-md border border-border text-muted-foreground hover:text-destructive hover:border-destructive transition"
            >
              <Trash2 size={16} />
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition"
          >
            Cancel
          </button>
          {canEdit && (
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="flex-1 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition disabled:opacity-60"
            >
              {updateMutation.isPending ? "Saving..." : "Save"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
