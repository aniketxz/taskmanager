"use client";

import { use } from "react";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { UserPlus, Trash2, ArrowLeft } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsApi, membersApi, tasksApi } from "@/lib/api";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import type { Task } from "@/components/tasks/TaskCard";

interface Member {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
}

function AddMemberModal({
  projectId,
  onClose,
}: {
  projectId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MEMBER">("MEMBER");

  const mutation = useMutation({
    mutationFn: () => membersApi.add(projectId, { email, role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("Member added");
      onClose();
    },
    onError: () => toast.error("Failed to add member"),
  });

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-lg w-full max-w-sm p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-foreground mb-5">
          Add member
        </h2>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="member@example.com"
              className="w-full px-3 py-2 rounded-md border border-border bg-input text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "ADMIN" | "MEMBER")}
              className="w-full px-3 py-2 rounded-md border border-border bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
            >
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
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
            disabled={!email || mutation.isPending}
            className="flex-1 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition disabled:opacity-60"
          >
            {mutation.isPending ? "Adding..." : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"board" | "members">("board");
  const [showAddMember, setShowAddMember] = useState(false);

  const { data: projectData, isLoading: projectLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectsApi.getOne(projectId).then((r) => r.data),
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: () => tasksApi.getAll(projectId).then((r) => r.data),
  });

  const removeMember = useMutation({
    mutationFn: (userId: string) => membersApi.remove(projectId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("Member removed");
    },
    onError: () => toast.error("Failed to remove member"),
  });

  if (projectLoading) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-48 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded-lg animate-pulse" />
      </div>
    );
  }

  const project = projectData?.project || projectData;
  const members: Member[] = projectData?.members || [];
  const tasks = (tasksData?.tasks || []).map((item: { task: Task; assignee: Task['assignee'] }) => ({
  ...item.task,
  assignee: item.assignee,
}));
  const userMember = members.find((m) => m.id === user?.id);
  const userRole = userMember?.role || "MEMBER";
  const isAdmin = userRole === "ADMIN";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-3"
        >
          <ArrowLeft size={14} />
          Projects
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {project?.name}
            </h1>
            {project?.description && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {project.description}
              </p>
            )}
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
            {userRole.toLowerCase()}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(["board", "members"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Board tab */}
      {tab === "board" && (
        <>
          {tasksLoading ? (
            <div className="grid grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-48 bg-muted rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : (
            <KanbanBoard
              tasks={tasks}
              projectId={projectId}
              userRole={userRole}
              currentUserId={user?.id || ""}
              members={members}
            />
          )}
        </>
      )}

      {/* Members tab */}
      {tab === "members" && (
        <div className="max-w-lg space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {members.length} member{members.length !== 1 ? "s" : ""}
            </p>
            {isAdmin && (
              <button
                onClick={() => setShowAddMember(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
              >
                <UserPlus size={14} />
                Add member
              </button>
            )}
          </div>

          <div className="space-y-1">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent transition group"
              >
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-foreground shrink-0">
                  {member.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {member.name}
                    {member.id === user?.id && (
                      <span className="text-muted-foreground font-normal ml-1">
                        (you)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {member.email}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {member.role.toLowerCase()}
                </span>
                {isAdmin && member.id !== user?.id && (
                  <button
                    onClick={() => removeMember.mutate(member.id)}
                    className="text-muted-foreground hover:text-destructive transition opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showAddMember && (
        <AddMemberModal
          projectId={projectId}
          onClose={() => setShowAddMember(false)}
        />
      )}
    </div>
  );
}
