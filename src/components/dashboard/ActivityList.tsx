import React, { useMemo, useState } from "react";
import {
  CheckSquare,
  Clock,
  PhoneCall,
  Users,
  Video,
  FileText,
  CheckCircle2,
  Circle,
  AlertCircle,
  Filter,
} from "lucide-react";
import { CRMTask } from "../../types/crm";
import { useCRM } from "../../context/CRMContext";
import { getLocalDateString } from "../../utils/formatters";

interface ActivityListProps {
  onTaskCompleted: (taskName: string) => void;
}

export const ActivityList: React.FC<ActivityListProps> = ({
  onTaskCompleted,
}) => {
  const { tasks: sharedTasks, activities: sharedActivities, completeTask, reopenTask, completeActivity } = useCRM();
  const [activeFilter, setActiveFilter] = useState<"minhas" | "equipe" | "atrasadas">("minhas");

  const toggleTaskCompletion = (taskId: string) => {
    const task = sharedTasks.find((item) => item.id === taskId);
    if (task) {
      if (task.status === "completed") reopenTask(taskId);
      else {
        completeTask(taskId);
        onTaskCompleted(task.title);
      }
      return;
    }
    const activity = sharedActivities.find((item) => item.id === taskId);
    if (activity && activity.status !== "completed") {
      completeActivity(taskId);
      onTaskCompleted(activity.title);
    }
  };

  const tasks = useMemo<CRMTask[]>(() => [
    ...sharedTasks
    .filter((task) => !task.archivedAt && task.dueDate === getLocalDateString())
    .map((task) => ({
      id: task.id,
      time: task.dueTime || "09:00",
      type: "Follow-up",
      companyName: task.title || task.entityName || "Sem vínculo",
      assigneeName: task.ownerName,
      status: task.status === "completed" ? "concluida" : task.dueDate < getLocalDateString() ? "atrasada" : "pendente",
      isMine: task.ownerId === "usr-1",
      priority: task.priority === "high" ? "alta" : task.priority === "low" ? "baixa" : "media",
    })),
    ...sharedActivities
      .filter((activity) => !activity.archivedAt && activity.startAt.startsWith(getLocalDateString()))
      .map((activity) => ({
        id: activity.id,
        time: activity.startAt.includes("T") ? activity.startAt.split("T")[1].slice(0, 5) : "09:00",
        type: activity.type === "meeting" ? "Reunião" : activity.type === "call" ? "Ligação" : "Follow-up",
        companyName: activity.title,
        assigneeName: activity.ownerName,
        status: activity.status === "completed" ? "concluida" : "pendente",
        isMine: activity.ownerId === "usr-1",
        priority: "media",
      })),
  ], [sharedActivities, sharedTasks]);

  const filteredTasks = tasks.filter((task) => {
    if (activeFilter === "minhas") return task.isMine;
    if (activeFilter === "atrasadas") return task.status === "atrasada";
    return true;
  });

  const renderTypeIcon = (type: string) => {
    switch (type) {
      case "Ligação":
        return <PhoneCall className="h-3.5 w-3.5 text-blue-600" />;
      case "Reunião":
        return <Users className="h-3.5 w-3.5 text-indigo-600" />;
      case "Demo comercial":
        return <Video className="h-3.5 w-3.5 text-purple-600" />;
      case "Follow-up":
        return <Clock className="h-3.5 w-3.5 text-amber-600" />;
      default:
        return <FileText className="h-3.5 w-3.5 text-slate-600" />;
    }
  };

  return (
    <div data-testid="dashboard-activities-today" className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header & Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Atividades de hoje
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                {filteredTasks.length} tarefas
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Compromissos e obrigações comerciais do dia
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 self-start sm:self-auto">
            <button
              onClick={() => setActiveFilter("minhas")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                activeFilter === "minhas"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Minhas
            </button>
            <button
              onClick={() => setActiveFilter("equipe")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                activeFilter === "equipe"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Equipe
            </button>
            <button
              onClick={() => setActiveFilter("atrasadas")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                activeFilter === "atrasadas"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-rose-600 hover:text-rose-800"
              }`}
            >
              Atrasadas
            </button>
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-2.5">
          {filteredTasks.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Nenhuma atividade encontrada neste filtro.
            </div>
          ) : (
            filteredTasks.map((task) => {
              const isCompleted = task.status === "concluida";
              const isLate = task.status === "atrasada";

              return (
                <div
                  key={task.id}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isCompleted
                      ? "bg-slate-50/60 border-slate-200/50 opacity-60 line-through"
                      : isLate
                      ? "bg-rose-50/30 border-rose-200/80"
                      : "bg-white border-slate-200/80 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => toggleTaskCompletion(task.id)}
                      className="p-1 text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
                      title={isCompleted ? "Marcar como pendente" : "Marcar como concluída"}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-300 hover:text-indigo-600" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">
                          {task.time}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {renderTypeIcon(task.type)}
                          {task.type}
                        </span>
                        <span className="font-semibold text-xs text-slate-800 truncate">
                          {task.companyName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <span>Resp: <strong className="text-slate-700">{task.assigneeName}</strong></span>
                        {isLate && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-100/80 px-1.5 py-0.2 rounded-md">
                            <AlertCircle className="h-2.5 w-2.5" /> Atrasada
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleTaskCompletion(task.id)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors shrink-0 ${
                      isCompleted
                        ? "bg-slate-200 text-slate-700"
                        : "bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700"
                    }`}
                  >
                    {isCompleted ? "Concluída" : "Concluir"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer summary */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
        <span>Próxima ligação agendada: <strong className="text-slate-800">14:30</strong></span>
        <span className="text-[10px] text-slate-400">Clique para alternar estado da tarefa</span>
      </div>
    </div>
  );
};
