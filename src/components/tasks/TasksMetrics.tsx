import React from "react";
import { CheckSquare, Clock, AlertTriangle, CheckCircle2, Calendar, UserX } from "lucide-react";
import { TaskItem } from "../../types/crm";

interface TasksMetricsProps {
  tasks: TaskItem[];
  activeQuickFilter: string | null;
  onSelectQuickFilter: (filterKey: string | null) => void;
}

export const TasksMetrics: React.FC<TasksMetricsProps> = ({
  tasks,
  activeQuickFilter,
  onSelectQuickFilter,
}) => {
  const activeTasks = tasks.filter((t) => !t.archivedAt);
  const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const pendingCount = activeTasks.filter((t) => t.status === "pending").length;
  const overdueCount = activeTasks.filter(
    (t) => t.status === "pending" && t.dueDate < todayStr
  ).length;
  const todayCount = activeTasks.filter(
    (t) => t.status === "pending" && t.dueDate === todayStr
  ).length;
  const completedCount = activeTasks.filter((t) => t.status === "completed").length;
  const highPriorityCount = activeTasks.filter(
    (t) => t.status === "pending" && t.priority === "high"
  ).length;
  const unassignedCount = activeTasks.filter(
    (t) => t.status === "pending" && (!t.ownerId || t.ownerId === "")
  ).length;

  const cards = [
    {
      key: "pending",
      label: "Pendentes",
      count: pendingCount,
      icon: CheckSquare,
      color: "indigo",
      bgLight: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50",
      activeRing: "ring-2 ring-indigo-500",
    },
    {
      key: "overdue",
      label: "Vencidas",
      count: overdueCount,
      icon: AlertTriangle,
      color: "red",
      bgLight: overdueCount > 0 
        ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50"
        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700",
      activeRing: "ring-2 ring-red-500",
    },
    {
      key: "today",
      label: "Para Hoje",
      count: todayCount,
      icon: Calendar,
      color: "amber",
      bgLight: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50",
      activeRing: "ring-2 ring-amber-500",
    },
    {
      key: "completed",
      label: "Concluídas",
      count: completedCount,
      icon: CheckCircle2,
      color: "emerald",
      bgLight: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50",
      activeRing: "ring-2 ring-emerald-500",
    },
    {
      key: "high_priority",
      label: "Alta Prioridade",
      count: highPriorityCount,
      icon: Clock,
      color: "rose",
      bgLight: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/50",
      activeRing: "ring-2 ring-rose-500",
    },
    {
      key: "unassigned",
      label: "Sem Responsável",
      count: unassignedCount,
      icon: UserX,
      color: "slate",
      bgLight: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
      activeRing: "ring-2 ring-slate-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeQuickFilter === card.key;

        return (
          <button
            key={card.key}
            onClick={() =>
              onSelectQuickFilter(isActive ? null : card.key)
            }
            className={`p-3.5 rounded-2xl border transition-all text-left bg-white dark:bg-slate-900 shadow-sm hover:shadow-md cursor-pointer ${
              card.bgLight
            } ${isActive ? card.activeRing : ""}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold tracking-tight">
                {card.label}
              </span>
              <Icon className="h-4 w-4 opacity-80" />
            </div>
            <div className="text-2xl font-black tracking-tight">{card.count}</div>
          </button>
        );
      })}
    </div>
  );
};
