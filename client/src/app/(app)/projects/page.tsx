"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsApi } from "@/lib/api";
import { toast } from "sonner";
import { Plus, FolderKanban, Users } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
	name: z.string().min(1).max(100),
	description: z.string().max(500).optional(),
});
type FormData = z.infer<typeof schema>;

interface Project {
	project: {
		id: string;
		name: string;
		description?: string;
		createdAt: string;
	};
	role: "ADMIN" | "MEMBER";
}

function CreateProjectModal({ onClose }: { onClose: () => void }) {
	const qc = useQueryClient();
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<FormData>({ resolver: zodResolver(schema) });

	const mutation = useMutation({
		mutationFn: (data: FormData) => projectsApi.create(data),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["projects"] });
			toast.success("Project created");
			onClose();
		},
		onError: () => toast.error("Failed to create project"),
	});

	return (
		<div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
			<div className="bg-card border border-border rounded-lg w-full max-w-md p-6 shadow-lg">
				<h2 className="text-base font-semibold text-foreground mb-5">
					New project
				</h2>
				<form
					onSubmit={handleSubmit((d) => mutation.mutate(d))}
					className="space-y-4"
				>
					<div className="space-y-1">
						<label className="text-sm font-medium text-foreground">Name</label>
						<input
							{...register("name")}
							placeholder="Project name"
							className="w-full px-3 py-2 rounded-md border border-border bg-input text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
						/>
						{errors.name && (
							<p className="text-xs text-destructive">{errors.name.message}</p>
						)}
					</div>
					<div className="space-y-1">
						<label className="text-sm font-medium text-foreground">
							Description{" "}
							<span className="text-muted-foreground font-normal">
								(optional)
							</span>
						</label>
						<textarea
							{...register("description")}
							placeholder="What's this project about?"
							rows={3}
							className="w-full px-3 py-2 rounded-md border border-border bg-input text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition resize-none"
						/>
					</div>
					<div className="flex gap-2 pt-1">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={mutation.isPending}
							className="flex-1 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition disabled:opacity-60"
						>
							{mutation.isPending ? "Creating..." : "Create"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

export default function ProjectsPage() {
	const [showCreate, setShowCreate] = useState(false);

	const { data, isLoading } = useQuery({
		queryKey: ["projects"],
		queryFn: () => projectsApi.getAll().then((r) => r.data),
	});

	const projects: Project[] = data?.projects || data || [];

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-xl font-semibold text-foreground">Projects</h1>
					<p className="text-sm text-muted-foreground mt-0.5">
						{projects.length} project{projects.length !== 1 ? "s" : ""}
					</p>
				</div>
				<button
					onClick={() => setShowCreate(true)}
					className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
				>
					<Plus size={15} />
					New project
				</button>
			</div>

			{isLoading ? (
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="h-28 bg-muted rounded-lg animate-pulse" />
					))}
				</div>
			) : projects.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-20 text-center">
					<FolderKanban size={32} className="text-muted-foreground mb-3" />
					<p className="text-sm font-medium text-foreground">No projects yet</p>
					<p className="text-sm text-muted-foreground mt-1">
						Create one to get started
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
					{projects.map((item) => (
						<Link
							key={item.project.id}
							href={`/projects/${item.project.id}`}
							className="block bg-card border border-border rounded-lg p-5 hover:border-ring transition-colors group"
						>
							<div className="flex items-start justify-between mb-2">
								<h2 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
									{item.project.name}
								</h2>
								<span
									className={`text-xs px-2 py-0.5 rounded-full font-medium ${
										item.role === "ADMIN"
											? "bg-primary/15 text-primary-foreground"
											: "bg-muted text-muted-foreground"
									}`}
								>
									{item.role.toLowerCase()}
								</span>
							</div>
							{item.project.description && (
								<p className="text-sm text-muted-foreground line-clamp-2 mb-3">
									{item.project.description}
								</p>
							)}
						</Link>
					))}
				</div>
			)}

			{showCreate && (
				<CreateProjectModal onClose={() => setShowCreate(false)} />
			)}
		</div>
	);
}
