import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format, isPast } from "date-fns";
import { AlertCircle } from "lucide-react";

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "TODO" | "IN_PROGRESS" | "DONE";
  assignedTo?: string;
  assignee?: { id: string; name: string; email: string };
}

const PRIORITY_STYLES = {
  LOW: "bg-muted text-muted-foreground",
  MEDIUM: "bg-chart-4/20 text-chart-4",
  HIGH: "bg-destructive/15 text-destructive",
};

export function TaskCard({
  task,
  onClick,
}: {
  task: Task;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const isOverdue =
    task.dueDate && task.status !== "DONE" && isPast(new Date(task.dueDate));

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`bg-card border border-border rounded-md p-3 cursor-pointer hover:border-ring transition-colors select-none ${
        isDragging ? "opacity-50 shadow-lg" : ""
      }`}
    >
      <p className="text-sm text-foreground font-medium leading-snug mb-2">
        {task.title}
      </p>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span
          className={`text-xs px-1.5 py-0.5 rounded font-medium ${
            PRIORITY_STYLES[task.priority]
          }`}
        >
          {task.priority.toLowerCase()}
        </span>

        <div className="flex items-center gap-2 ml-auto">
          {task.dueDate && (
            <span
              className={`flex items-center gap-1 text-xs ${
                isOverdue ? "text-destructive" : "text-muted-foreground"
              }`}
            >
              {isOverdue && <AlertCircle size={11} />}
              {format(new Date(task.dueDate), "MMM d")}
            </span>
          )}
          {task.assignee && (
            <div
              title={task.assignee.name}
              className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary-foreground"
            >
              {task.assignee.name[0].toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
