import React, { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Filter,
  CheckSquare,
  LayoutGrid,
  List,
  AlertTriangle,
  Clock,
  Calendar,
  User,
  Tag,
  CheckCircle2,
  X,
  Edit2,
  Archive,
  RotateCcw,
  Link as LinkIcon,
  ChevronDown,
  ArrowUpDown,
  MoreVertical,
  Building2,
  Briefcase,
  UserCheck,
} from "lucide-react";
import { TaskItem } from "../../types/crm";
import { useCRM } from "../../context/CRMContext";
import { TasksMetrics } from "./TasksMetrics";
import { TaskFormModal, MOCK_TASK_OWNERS } from "./TaskFormModal";
import { TasksBulkActions } from "./TasksBulkActions";

interface TasksPageProps {
  onShowToast: (msg: string) => void;
  onNavigateToEntity?: (type: string, id: string) => void;
}

export const TasksPage: React.FC<TasksPageProps> = ({
  onShowToast,
  onNavigateToEntity,
}) => {
  const {
    tasks,
    addTask,
    updateTask,
    completeTask,
    reopenTask,
    archiveTask,
    bulkUpdateTasksOwner,
    bulkUpdateTasksPriority,
    bulkUpdateTasksDueDate,
    bulkCompleteTasks,
    bulkReopenTasks,
    bulkArchiveTasks,
  } = useCRM();

  // View mode
  const [viewMode, setViewMode] = useState<"list" | "board">("list");

  // Selection state
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<"all" | "overdue" | "today" | "week" | "month">("all");
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("all");
  const [sortOption, setSortOption] = useState<"due_asc" | "created_desc" | "priority_desc" | "title_asc">("due_asc");
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null);

  // Mobile filters drawer
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  // Quick metric filter sync
  const handleSelectQuickFilter = (filterKey: string | null) => {
    setActiveQuickFilter(filterKey);
    if (!filterKey) {
      setStatusFilter("all");
      setPriorityFilter("all");
      setDateFilter("all");
      setOwnerFilter("all");
      return;
    }

    if (filterKey === "pending") {
      setStatusFilter("pending");
      setDateFilter("all");
      setPriorityFilter("all");
    } else if (filterKey === "overdue") {
      setStatusFilter("pending");
      setDateFilter("overdue");
      setPriorityFilter("all");
    } else if (filterKey === "today") {
      setStatusFilter("pending");
      setDateFilter("today");
      setPriorityFilter("all");
    } else if (filterKey === "completed") {
      setStatusFilter("completed");
      setDateFilter("all");
      setPriorityFilter("all");
    } else if (filterKey === "high_priority") {
      setStatusFilter("pending");
      setPriorityFilter("high");
      setDateFilter("all");
    } else if (filterKey === "unassigned") {
      setStatusFilter("pending");
      setOwnerFilter("unassigned");
    }
  };

  // Filter & Sort tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Ignore archived tasks
      if (task.archivedAt) return false;

      // Text Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDesc = (task.description || "").toLowerCase().includes(query);
        const matchesOwner = task.ownerName.toLowerCase().includes(query);
        const matchesEntity = (task.entityName || "").toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesOwner && !matchesEntity) {
          return false;
        }
      }

      // Status
      if (statusFilter === "pending" && task.status !== "pending") return false;
      if (statusFilter === "completed" && task.status !== "completed") return false;

      // Priority
      if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;

      // Owner
      if (ownerFilter === "unassigned") {
        if (task.ownerId && task.ownerId !== "") return false;
      } else if (ownerFilter !== "all" && task.ownerId !== ownerFilter) {
        return false;
      }

      // Date / Prazo
      if (dateFilter === "overdue") {
        if (task.status !== "pending" || task.dueDate >= todayStr) return false;
      } else if (dateFilter === "today") {
        if (task.dueDate !== todayStr) return false;
      } else if (dateFilter === "week") {
        const dateObj = new Date(task.dueDate);
        const nowObj = new Date();
        const diffDays = (dateObj.getTime() - nowObj.getTime()) / (1000 * 3600 * 24);
        if (diffDays < -1 || diffDays > 7) return false;
      } else if (dateFilter === "month") {
        const taskMonth = task.dueDate.substring(0, 7);
        const currentMonth = todayStr.substring(0, 7);
        if (taskMonth !== currentMonth) return false;
      }

      // Entity type
      if (entityTypeFilter === "unlinked") {
        if (task.entityType) return false;
      } else if (entityTypeFilter !== "all" && task.entityType !== entityTypeFilter) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortOption === "due_asc") {
        return a.dueDate.localeCompare(b.dueDate);
      } else if (sortOption === "created_desc") {
        return b.createdAt.localeCompare(a.createdAt);
      } else if (sortOption === "priority_desc") {
        const prioMap = { high: 3, medium: 2, low: 1 };
        return prioMap[b.priority] - prioMap[a.priority];
      } else if (sortOption === "title_asc") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [
    tasks,
    searchTerm,
    statusFilter,
    priorityFilter,
    ownerFilter,
    dateFilter,
    entityTypeFilter,
    sortOption,
    todayStr,
  ]);

  // Select all handler
  const isAllSelected =
    filteredTasks.length > 0 &&
    filteredTasks.every((t) => selectedTaskIds.includes(t.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(filteredTasks.map((t) => t.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Task Action Handlers
  const handleSaveTask = (taskData: Partial<TaskItem>) => {
    if (editingTask) {
      updateTask(editingTask.id, taskData);
      onShowToast("Tarefa atualizada com sucesso!");
    } else {
      addTask(taskData);
      onShowToast("Nova tarefa criada com sucesso!");
    }
    setEditingTask(null);
  };

  const handleToggleTaskStatus = (task: TaskItem) => {
    if (task.status === "completed") {
      reopenTask(task.id);
      onShowToast("Tarefa reaberta.");
    } else {
      completeTask(task.id);
      onShowToast("Tarefa concluída!");
    }
  };

  const handleArchiveSingleTask = (id: string) => {
    archiveTask(id);
    onShowToast("Tarefa arquivada.");
  };

  // Bulk Handlers
  const handleBulkComplete = () => {
    bulkCompleteTasks(selectedTaskIds);
    onShowToast(`${selectedTaskIds.length} tarefa(s) concluída(s)!`);
    setSelectedTaskIds([]);
  };

  const handleBulkReopen = () => {
    bulkReopenTasks(selectedTaskIds);
    onShowToast(`${selectedTaskIds.length} tarefa(s) reaberta(s).`);
    setSelectedTaskIds([]);
  };

  const handleBulkArchive = () => {
    bulkArchiveTasks(selectedTaskIds);
    onShowToast(`${selectedTaskIds.length} tarefa(s) arquivada(s).`);
    setSelectedTaskIds([]);
  };

  const handleBulkChangeOwner = (ownerId: string, ownerName: string) => {
    bulkUpdateTasksOwner(selectedTaskIds, ownerId, ownerName);
    onShowToast(`Responsável alterado para ${ownerName}.`);
    setSelectedTaskIds([]);
  };

  const handleBulkChangePriority = (priority: "low" | "medium" | "high") => {
    bulkUpdateTasksPriority(selectedTaskIds, priority);
    onShowToast("Prioridade alterada.");
    setSelectedTaskIds([]);
  };

  const handleBulkChangeDueDate = (dueDate: string) => {
    bulkUpdateTasksDueDate(selectedTaskIds, dueDate);
    onShowToast("Prazo atualizado.");
    setSelectedTaskIds([]);
  };

  // Helper badge renderers
  const renderPriorityBadge = (priority: "low" | "medium" | "high") => {
    if (priority === "high") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-800">
          <AlertTriangle className="h-3 w-3" /> Alta
        </span>
      );
    }
    if (priority === "medium") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
          Média
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
        Baixa
      </span>
    );
  };

  const renderDueDateBadge = (task: TaskItem) => {
    const isCompleted = task.status === "completed";
    const isOverdue = !isCompleted && task.dueDate < todayStr;
    const isToday = !isCompleted && task.dueDate === todayStr;

    let badgeClass = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    if (isOverdue) {
      badgeClass = "bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border border-red-300 dark:border-red-800 font-bold animate-pulse";
    } else if (isToday) {
      badgeClass = "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold";
    }

    const formattedDate = new Date(task.dueDate + "T00:00:00").toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs ${badgeClass}`}>
        <Calendar className="h-3.5 w-3.5" />
        <span>{isToday ? "Hoje" : formattedDate}</span>
        {task.dueTime && <span className="opacity-80">· {task.dueTime}</span>}
      </span>
    );
  };

  const renderEntityBadge = (task: TaskItem) => {
    if (!task.entityType || !task.entityName) return null;

    let Icon = LinkIcon;
    let typeLabel = "Vínculo";
    let colorClass = "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";

    if (task.entityType === "deal") {
      Icon = Briefcase;
      typeLabel = "Negócio";
      colorClass = "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800";
    } else if (task.entityType === "contact") {
      Icon = User;
      typeLabel = "Contato";
      colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800";
    } else if (task.entityType === "company") {
      Icon = Building2;
      typeLabel = "Empresa";
      colorClass = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800";
    } else if (task.entityType === "lead") {
      Icon = UserCheck;
      typeLabel = "Lead";
      colorClass = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800";
    }

    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (onNavigateToEntity && task.entityType && task.entityId) {
            onNavigateToEntity(task.entityType, task.entityId);
          } else {
            onShowToast(`${typeLabel}: ${task.entityName}`);
          }
        }}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border hover:opacity-80 transition-opacity ${colorClass}`}
        title={`Abrir ${typeLabel}: ${task.entityName}`}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate max-w-[140px]">{task.entityName}</span>
      </button>
    );
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6 pb-28">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
              <CheckSquare className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Tarefas
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gerencie ações operacionais, follow-ups e prazos da equipe comercial
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                viewMode === "list"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Lista</span>
            </button>
            <button
              onClick={() => setViewMode("board")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                viewMode === "board"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Quadro</span>
            </button>
          </div>

          {/* New Task Button */}
          <button
            onClick={() => {
              setEditingTask(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-transform active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Tarefa</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <TasksMetrics
        tasks={tasks}
        activeQuickFilter={activeQuickFilter}
        onSelectQuickFilter={handleSelectQuickFilter}
      />

      {/* Search & Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por título, descrição, responsável ou entidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowMobileFilters(true)}
            className="md:hidden flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200"
          >
            <Filter className="h-4 w-4 text-indigo-500" />
            <span>Filtros ({statusFilter !== "all" || priorityFilter !== "all" || ownerFilter !== "all" || dateFilter !== "all" ? "Ativos" : "Todos"})</span>
          </button>

          {/* Desktop Filter Selects */}
          <div className="hidden md:flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setActiveQuickFilter(null);
              }}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Status: Todos</option>
              <option value="pending">Pendentes</option>
              <option value="completed">Concluídas</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value as any);
                setActiveQuickFilter(null);
              }}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Prioridade: Todas</option>
              <option value="high">Alta</option>
              <option value="medium">Média</option>
              <option value="low">Baixa</option>
            </select>

            {/* Owner Filter */}
            <select
              value={ownerFilter}
              onChange={(e) => {
                setOwnerFilter(e.target.value);
                setActiveQuickFilter(null);
              }}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Responsável: Todos</option>
              {MOCK_TASK_OWNERS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
              <option value="unassigned">Sem responsável</option>
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value as any);
                setActiveQuickFilter(null);
              }}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Prazo: Todos</option>
              <option value="overdue">Vencidas</option>
              <option value="today">Para hoje</option>
              <option value="week">Esta semana</option>
              <option value="month">Este mês</option>
            </select>

            {/* Sort Options */}
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="due_asc">Ordem: Prazo mais próximo</option>
              <option value="created_desc">Ordem: Mais recentes</option>
              <option value="priority_desc">Ordem: Maior prioridade</option>
              <option value="title_asc">Ordem: Título A-Z</option>
            </select>
          </div>
        </div>

        {/* Clear filters pill indicator */}
        {(statusFilter !== "all" ||
          priorityFilter !== "all" ||
          ownerFilter !== "all" ||
          dateFilter !== "all" ||
          entityTypeFilter !== "all" ||
          activeQuickFilter !== null ||
          searchTerm !== "") && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Exibindo <strong className="text-slate-800 dark:text-slate-200">{filteredTasks.length}</strong> de {tasks.filter(t => !t.archivedAt).length} tarefas
            </span>
            <button
              onClick={() => {
                setStatusFilter("all");
                setPriorityFilter("all");
                setOwnerFilter("all");
                setDateFilter("all");
                setEntityTypeFilter("all");
                setSearchTerm("");
                setActiveQuickFilter(null);
              }}
              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5" /> Limpar filtros
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area: List View vs Board View */}
      {viewMode === "list" ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          {filteredTasks.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 flex items-center justify-center mx-auto">
                <CheckSquare className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Nenhuma tarefa encontrada
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Tente ajustar os termos de busca ou filtros ativos para visualizar tarefas.
              </p>
              <button
                onClick={() => {
                  setEditingTask(null);
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-4 w-4" /> Criar Tarefa
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <th className="py-3.5 px-4 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={handleToggleSelectAll}
                          className="rounded-md text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                      </th>
                      <th className="py-3.5 px-4">Tarefa</th>
                      <th className="py-3.5 px-4 w-32">Status</th>
                      <th className="py-3.5 px-4 w-28">Prioridade</th>
                      <th className="py-3.5 px-4 w-44">Prazo</th>
                      <th className="py-3.5 px-4 w-40">Responsável</th>
                      <th className="py-3.5 px-4 w-48">Relacionado a</th>
                      <th className="py-3.5 px-4 w-28 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                    {filteredTasks.map((task) => {
                      const isSelected = selectedTaskIds.includes(task.id);
                      const isCompleted = task.status === "completed";

                      return (
                        <tr
                          key={task.id}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                            isSelected ? "bg-indigo-50/40 dark:bg-indigo-950/20" : ""
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="py-3 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectOne(task.id)}
                              className="rounded-md text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                            />
                          </td>

                          {/* Task Title + Description preview + Tags */}
                          <td className="py-3 px-4">
                            <div className="flex items-start gap-3">
                              <button
                                onClick={() => handleToggleTaskStatus(task)}
                                className={`mt-0.5 shrink-0 h-5 w-5 rounded-md border transition-all flex items-center justify-center ${
                                  isCompleted
                                    ? "bg-emerald-600 border-emerald-600 text-white"
                                    : "border-slate-300 dark:border-slate-600 hover:border-indigo-500 text-transparent"
                                }`}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              </button>

                              <div>
                                <h4
                                  className={`font-semibold text-slate-800 dark:text-slate-100 cursor-pointer hover:text-indigo-600 ${
                                    isCompleted ? "line-through text-slate-400 dark:text-slate-500" : ""
                                  }`}
                                  onClick={() => {
                                    setEditingTask(task);
                                    setIsModalOpen(true);
                                  }}
                                >
                                  {task.title}
                                </h4>
                                {task.description && (
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                                    {task.description}
                                  </p>
                                )}
                                {task.tags && task.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {task.tags.map((t, idx) => (
                                      <span
                                        key={idx}
                                        className="text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.2 rounded-md"
                                      >
                                        #{t}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleToggleTaskStatus(task)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-transform active:scale-95 ${
                                isCompleted
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300"
                              }`}
                            >
                              {isCompleted ? (
                                <>
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>Concluída</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="h-3 w-3" />
                                  <span>Pendente</span>
                                </>
                              )}
                            </button>
                          </td>

                          {/* Priority */}
                          <td className="py-3 px-4">
                            {renderPriorityBadge(task.priority)}
                          </td>

                          {/* Prazo */}
                          <td className="py-3 px-4">
                            {renderDueDateBadge(task)}
                          </td>

                          {/* Responsável */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                                {task.ownerName
                                  ? task.ownerName
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .substring(0, 2)
                                  : "?"}
                              </div>
                              <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[110px]">
                                {task.ownerName || "Sem responsável"}
                              </span>
                            </div>
                          </td>

                          {/* Relacionado a */}
                          <td className="py-3 px-4">
                            {renderEntityBadge(task) || (
                              <span className="text-slate-400 text-[11px] italic">Sem vínculo</span>
                            )}
                          </td>

                          {/* Ações */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setEditingTask(task);
                                  setIsModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleArchiveSingleTask(task.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                title="Arquivar"
                              >
                                <Archive className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile / Compact List Cards View */}
              <div className="block lg:hidden divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTasks.map((task) => {
                  const isSelected = selectedTaskIds.includes(task.id);
                  const isCompleted = task.status === "completed";

                  return (
                    <div
                      key={task.id}
                      className={`p-4 space-y-3 ${
                        isSelected ? "bg-indigo-50/40 dark:bg-indigo-950/20" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectOne(task.id)}
                            className="mt-1 rounded-md text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                          />
                          <button
                            onClick={() => handleToggleTaskStatus(task)}
                            className={`mt-0.5 shrink-0 h-5 w-5 rounded-md border transition-all flex items-center justify-center ${
                              isCompleted
                                ? "bg-emerald-600 border-emerald-600 text-white"
                                : "border-slate-300 dark:border-slate-600 hover:border-indigo-500 text-transparent"
                            }`}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </button>
                          <div>
                            <h4
                              className={`font-bold text-sm text-slate-800 dark:text-slate-100 ${
                                isCompleted ? "line-through text-slate-400 dark:text-slate-500" : ""
                              }`}
                              onClick={() => {
                                setEditingTask(task);
                                setIsModalOpen(true);
                              }}
                            >
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => {
                              setEditingTask(task);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleArchiveSingleTask(task.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600"
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                          {renderPriorityBadge(task.priority)}
                          {renderDueDateBadge(task)}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            {task.ownerName}
                          </span>
                        </div>
                      </div>

                      {task.entityName && (
                        <div className="pt-1">{renderEntityBadge(task)}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      ) : (
        /* Board View (Kanban 2 Cols: Pendentes vs Concluídas) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column 1: Pendentes */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-amber-500" />
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  Pendentes
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                  {filteredTasks.filter((t) => t.status === "pending").length}
                </span>
              </div>
              <button
                onClick={() => {
                  setEditingTask(null);
                  setIsModalOpen(true);
                }}
                className="p-1 text-slate-500 hover:text-indigo-600"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 min-h-[200px]">
              {filteredTasks
                .filter((t) => t.status === "pending")
                .map((task) => (
                  <div
                    key={task.id}
                    className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-md transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4
                        className="font-bold text-sm text-slate-800 dark:text-slate-100 cursor-pointer hover:text-indigo-600"
                        onClick={() => {
                          setEditingTask(task);
                          setIsModalOpen(true);
                        }}
                      >
                        {task.title}
                      </h4>
                      <button
                        onClick={() => handleToggleTaskStatus(task)}
                        className="h-5 w-5 rounded-md border border-slate-300 dark:border-slate-600 hover:border-emerald-500 shrink-0"
                        title="Concluir tarefa"
                      />
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        {renderPriorityBadge(task.priority)}
                        {renderDueDateBadge(task)}
                      </div>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        {task.ownerName}
                      </span>
                    </div>

                    {task.entityName && (
                      <div className="pt-1">{renderEntityBadge(task)}</div>
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* Column 2: Concluídas */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  Concluídas
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                  {filteredTasks.filter((t) => t.status === "completed").length}
                </span>
              </div>
            </div>

            <div className="space-y-3 min-h-[200px]">
              {filteredTasks
                .filter((t) => t.status === "completed")
                .map((task) => (
                  <div
                    key={task.id}
                    className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs opacity-75 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4
                        className="font-bold text-sm line-through text-slate-400 dark:text-slate-500 cursor-pointer hover:text-indigo-600"
                        onClick={() => {
                          setEditingTask(task);
                          setIsModalOpen(true);
                        }}
                      >
                        {task.title}
                      </h4>
                      <button
                        onClick={() => handleToggleTaskStatus(task)}
                        className="h-5 w-5 rounded-md bg-emerald-600 text-white flex items-center justify-center shrink-0"
                        title="Reabrir tarefa"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] font-medium text-slate-500">
                        Concluída por {task.ownerName}
                      </span>
                      {renderDueDateBadge(task)}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Bulk Actions Bar */}
      <TasksBulkActions
        selectedCount={selectedTaskIds.length}
        onClearSelection={() => setSelectedTaskIds([])}
        onBulkComplete={handleBulkComplete}
        onBulkReopen={handleBulkReopen}
        onBulkArchive={handleBulkArchive}
        onBulkChangeOwner={handleBulkChangeOwner}
        onBulkChangePriority={handleBulkChangePriority}
        onBulkChangeDueDate={handleBulkChangeDueDate}
      />

      {/* Task Form Modal (Create / Edit) */}
      <TaskFormModal
        isOpen={isModalOpen}
        taskToEdit={editingTask}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
      />

      {/* Mobile Filters Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/60 backdrop-blur-xs md:hidden">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl p-6 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Filtros de Tarefas
              </h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                >
                  <option value="all">Todos</option>
                  <option value="pending">Pendentes</option>
                  <option value="completed">Concluídas</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Prioridade
                </label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                >
                  <option value="all">Todas</option>
                  <option value="high">Alta</option>
                  <option value="medium">Média</option>
                  <option value="low">Baixa</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Responsável
                </label>
                <select
                  value={ownerFilter}
                  onChange={(e) => setOwnerFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                >
                  <option value="all">Todos</option>
                  {MOCK_TASK_OWNERS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                  <option value="unassigned">Sem responsável</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Prazo
                </label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                >
                  <option value="all">Todos</option>
                  <option value="overdue">Vencidas</option>
                  <option value="today">Para hoje</option>
                  <option value="week">Esta semana</option>
                  <option value="month">Este mês</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setPriorityFilter("all");
                  setOwnerFilter("all");
                  setDateFilter("all");
                  setEntityTypeFilter("all");
                  setSearchTerm("");
                  setShowMobileFilters(false);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Limpar
              </button>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
