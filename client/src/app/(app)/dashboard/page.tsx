"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api";
import { CheckCircle2, Clock, AlertCircle, ListTodo } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  accent?: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon
          size={16}
          className={accent ? "text-destructive" : "text-muted-foreground"}
        />
      </div>
      <p
        className={`text-3xl font-semibold tracking-tight ${
          accent ? "text-destructive" : "text-foreground"
        }`}
      >
        {value ?? 0}
      </p>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  TODO: "var(--color-chart-4)",
  IN_PROGRESS: "var(--color-chart-2)",
  DONE: "var(--color-chart-1)",
};

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => dashboardApi.getStats().then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-32 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats || data || {};
  const statusBreakdown: Record<string, number> = stats.statusBreakdown || {};
  const userWorkloads: { name: string; taskCount: number }[] =
    stats.userWorkloads || [];

  const chartData = Object.entries(statusBreakdown).map(([status, count]) => ({
    status: status.replace("_", " "),
    count,
    key: status,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Overview across all your projects
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total tasks"
          value={stats.totalTasks}
          icon={ListTodo}
        />
        <StatCard
          label="Completed"
          value={statusBreakdown["DONE"]}
          icon={CheckCircle2}
        />
        <StatCard
          label="In progress"
          value={statusBreakdown["IN_PROGRESS"]}
          icon={Clock}
        />
        <StatCard
          label="Overdue"
          value={stats.overdueTasks}
          icon={AlertCircle}
          accent
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Status chart */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-sm font-medium text-foreground mb-4">
            Tasks by status
          </h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} barSize={32}>
                <XAxis
                  dataKey="status"
                  tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                  cursor={{ fill: "var(--color-accent)" }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.key}
                      fill={STATUS_COLORS[entry.key] || "var(--color-primary)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">No data yet</p>
          )}
        </div>

        {/* Workload table */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-sm font-medium text-foreground mb-4">
            Member workload
          </h2>
          {userWorkloads.length > 0 ? (
            <div className="space-y-3">
              {userWorkloads.map((member) => (
                <div key={member.name} className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-full bg-accent flex items-center justify-center text-xs font-medium text-foreground shrink-0">
                    {member.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-foreground truncate">
                        {member.name}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {member.taskCount}
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            (member.taskCount /
                              Math.max(
                                ...userWorkloads.map((m) => m.taskCount),
                                1
                              )) *
                              100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No members yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
