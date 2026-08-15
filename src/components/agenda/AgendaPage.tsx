import React, { useState, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
  User,
  Clock,
  MapPin,
  Video,
  PhoneCall,
  Users,
  Mail,
  RefreshCw,
  CheckSquare,
  X,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Building2,
  Briefcase,
  UserCheck,
  Link as LinkIcon,
  Search,
} from "lucide-react";
import { ActivityItem, TaskItem } from "../../types/crm";
import { useCRM } from "../../context/CRMContext";
import { ActivityFormModal } from "./ActivityFormModal";
import { TaskFormModal, MOCK_TASK_OWNERS } from "../tasks/TaskFormModal";
import { getLocalDateString } from "../../utils/formatters";
import { hasSupabaseConfiguration } from "../../lib/supabase/env";

interface AgendaPageProps {
  onShowToast: (msg: string) => void;
  onNavigateToEntity?: (type: string, id: string) => void;
}

export const AgendaPage: React.FC<AgendaPageProps> = ({
  onShowToast,
  onNavigateToEntity,
}) => {
  const {
    activities,
    tasks,
    addActivity,
    updateActivity,
    completeActivity,
    cancelActivity,
    completeTask,
    reopenTask,
    members,
  } = useCRM();
  const ownerOptions = hasSupabaseConfiguration() ? members : MOCK_TASK_OWNERS;

  // View modes
  const [viewMode, setViewMode] = useState<"day" | "week" | "month" | "list">("week");
  const [teamMode, setTeamMode] = useState<"mine" | "team">("team");

  // Selected reference date
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const [year, month, day] = getLocalDateString().split("-").map(Number);
    return new Date(year, month - 1, day);
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");

  // Modals
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityItem | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time?: string } | null>(null);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedItemDetail, setSelectedItemDetail] = useState<{
    item: ActivityItem | TaskItem;
    itemType: "activity" | "task";
  } | null>(null);

  // Format YYYY-MM-DD
  const formatDateISO = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const currentDateISO = formatDateISO(currentDate);

  // Date Navigation
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === "day") d.setDate(d.getDate() - 1);
    else if (viewMode === "week") d.setDate(d.getDate() - 7);
    else if (viewMode === "month") d.setMonth(d.getMonth() - 1);
    else d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === "day") d.setDate(d.getDate() + 1);
    else if (viewMode === "week") d.setDate(d.getDate() + 7);
    else if (viewMode === "month") d.setMonth(d.getMonth() + 1);
    else d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  const handleToday = () => {
    const [year, month, day] = getLocalDateString().split("-").map(Number);
    setCurrentDate(new Date(year, month - 1, day));
  };

  // Combine Activities & Tasks
  const combinedAgendaItems = useMemo(() => {
    // 1. Filter Activities
    const activeActivities = activities.filter((a) => {
      if (a.archivedAt) return false;
      if (teamMode === "mine" && a.ownerId !== "usr-1") return false;
      if (ownerFilter !== "all" && a.ownerId !== ownerFilter) return false;
      if (typeFilter !== "all" && typeFilter !== "task" && a.type !== typeFilter) return false;
      if (typeFilter === "task") return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesTitle = a.title.toLowerCase().includes(q);
        const matchesDesc = (a.description || "").toLowerCase().includes(q);
        const matchesOwner = a.ownerName.toLowerCase().includes(q);
        const matchesEntity = (a.entityName || "").toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesOwner && !matchesEntity) return false;
      }
      return true;
    });

    // 2. Filter Tasks
    const activeTasks = tasks.filter((t) => {
      if (t.archivedAt) return false;
      if (teamMode === "mine" && t.ownerId !== "usr-1") return false;
      if (ownerFilter !== "all" && t.ownerId !== ownerFilter) return false;
      if (typeFilter !== "all" && typeFilter !== "task") return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesDesc = (t.description || "").toLowerCase().includes(q);
        const matchesOwner = t.ownerName.toLowerCase().includes(q);
        const matchesEntity = (t.entityName || "").toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesOwner && !matchesEntity) return false;
      }
      return true;
    });

    return { activities: activeActivities, tasks: activeTasks };
  }, [activities, tasks, teamMode, ownerFilter, typeFilter, searchTerm]);

  // Week Days Array (Mon - Sun)
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    startOfWeek.setDate(diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentDate]);

  // Month Grid Days Array
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Mon = 0
    const totalDays = lastDay.getDate();

    const grid = [];
    // Prev month padding
    for (let i = 0; i < startDayOfWeek; i++) {
      const d = new Date(year, month, 1 - (startDayOfWeek - i));
      grid.push({ date: d, isCurrentMonth: false });
    }
    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      grid.push({ date: d, isCurrentMonth: true });
    }
    // Next month padding to fill 35 or 42 cells
    const remaining = 35 - grid.length;
    if (remaining > 0) {
      for (let i = 1; i <= remaining; i++) {
        const d = new Date(year, month + 1, i);
        grid.push({ date: d, isCurrentMonth: false });
      }
    }
    return grid;
  }, [currentDate]);

  // Hours array 08:00 - 19:00
  const hours = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];

  // Activity icon helper
  const getActivityIcon = (type: string) => {
    if (type === "call") return <PhoneCall className="h-3.5 w-3.5 text-emerald-500" />;
    if (type === "meeting") return <Users className="h-3.5 w-3.5 text-purple-500" />;
    if (type === "email") return <Mail className="h-3.5 w-3.5 text-blue-500" />;
    if (type === "follow_up") return <RefreshCw className="h-3.5 w-3.5 text-amber-500" />;
    return <CalendarIcon className="h-3.5 w-3.5 text-indigo-500" />;
  };

  const handleSaveActivity = (activityPayload: Partial<ActivityItem>) => {
    if (editingActivity) {
      updateActivity(editingActivity.id, activityPayload);
      onShowToast("Compromisso atualizado.");
    } else {
      addActivity(activityPayload);
      onShowToast("Compromisso agendado com sucesso!");
    }
    setEditingActivity(null);
    setSelectedSlot(null);
  };

  const handleCompleteSelectedActivity = () => {
    if (selectedItemDetail?.itemType !== "activity") return;
    completeActivity(selectedItemDetail.item.id);
    onShowToast("Atividade marcada como concluída.");
    setSelectedItemDetail(null);
  };

  const handleCancelSelectedActivity = () => {
    if (selectedItemDetail?.itemType !== "activity") return;
    cancelActivity(selectedItemDetail.item.id);
    onShowToast("Atividade cancelada.");
    setSelectedItemDetail(null);
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6 pb-28">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400">
              <CalendarIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Agenda Comercial
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visualize reuniões, chamadas, tarefas e compromissos operacionais
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Context Team Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setTeamMode("mine")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                teamMode === "mine"
                  ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Minhas
            </button>
            <button
              onClick={() => setTeamMode("team")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                teamMode === "team"
                  ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Equipe
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            {(["day", "week", "month", "list"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                  viewMode === mode
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                {mode === "day" ? "Dia" : mode === "week" ? "Semana" : mode === "month" ? "Mês" : "Lista"}
              </button>
            ))}
          </div>

          {/* New Event Button */}
          <button
            onClick={() => {
              setEditingActivity(null);
              setSelectedSlot(null);
              setShowActivityModal(true);
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-transform active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Compromisso</span>
          </button>
        </div>
      </div>

      {/* Navigation Bar & Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Month / Period Selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Hoje
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 ml-2 capitalize">
              {currentDate.toLocaleDateString("pt-BR", {
                month: "long",
                year: "numeric",
              })}
            </h2>
          </div>

          {/* Quick Filter Controls */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 sm:w-48">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar pauta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
              />
            </div>

            {/* Type filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              <option value="all">Tipo: Todos</option>
              <option value="meeting">Reuniões</option>
              <option value="call">Ligações</option>
              <option value="follow_up">Follow-ups</option>
              <option value="email">E-mails</option>
              <option value="task">Tarefas</option>
            </select>

            {/* Owner filter */}
            {teamMode === "team" && (
              <select
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                <option value="all">Resp: Todos</option>
                      {ownerOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* VIEW RENDERERS */}

      {/* 1. WEEK VIEW */}
      {viewMode === "week" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Week Header Row */}
            <div className="grid grid-cols-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="p-3 text-center text-[11px] font-bold text-slate-400 border-r border-slate-200 dark:border-slate-800">
                Horário
              </div>
              {weekDays.map((d, idx) => {
                const iso = formatDateISO(d);
                const isToday = iso === getLocalDateString();
                const dayName = d.toLocaleDateString("pt-BR", { weekday: "short" });

                return (
                  <div
                    key={idx}
                    className={`p-3 text-center border-r border-slate-200 dark:border-slate-800 ${
                      isToday ? "bg-indigo-50/50 dark:bg-indigo-950/30" : ""
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      {dayName}
                    </span>
                    <span
                      className={`inline-block mt-0.5 text-xs font-extrabold px-2 py-0.5 rounded-full ${
                        isToday
                          ? "bg-indigo-600 text-white"
                          : "text-slate-800 dark:text-slate-100"
                      }`}
                    >
                      {d.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Hours Rows */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {hours.map((hour) => (
                <div key={hour} className="grid grid-cols-8 min-h-[64px]">
                  {/* Hour label */}
                  <div className="p-2 text-center text-xs font-semibold text-slate-400 border-r border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                    {hour}
                  </div>

                  {/* Day cells */}
                  {weekDays.map((dayObj, dayIdx) => {
                    const dayIso = formatDateISO(dayObj);

                    // Filter activities in this slot
                    const slotActs = combinedAgendaItems.activities.filter((a) => {
                      if (!a.startAt.startsWith(dayIso)) return false;
                      const aTime = a.startAt.includes("T") ? a.startAt.split("T")[1].substring(0, 5) : "";
                      return aTime.substring(0, 2) === hour.substring(0, 2);
                    });

                    // Filter tasks in this slot
                    const slotTasks = combinedAgendaItems.tasks.filter((t) => {
                      if (t.dueDate !== dayIso) return false;
                      const tTime = t.dueTime || "12:00";
                      return tTime.substring(0, 2) === hour.substring(0, 2);
                    });

                    return (
                      <div
                        key={dayIdx}
                        onClick={() => {
                          setSelectedSlot({ date: dayIso, time: hour });
                          setEditingActivity(null);
                          setShowActivityModal(true);
                        }}
                        className="p-1 border-r border-slate-200 dark:border-slate-800 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 transition-colors cursor-pointer space-y-1 relative"
                      >
                        {/* Activities */}
                        {slotActs.map((act) => (
                          <div
                            key={act.id}
                            data-activity-id={act.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItemDetail({ item: act, itemType: "activity" });
                            }}
                            className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 text-[11px] space-y-0.5 shadow-2xs hover:scale-102 transition-transform"
                          >
                            <div className="flex items-center gap-1 font-bold">
                              {getActivityIcon(act.type)}
                              <span className="truncate">{act.title}</span>
                            </div>
                            <div className="flex items-center justify-between text-[9px] opacity-80">
                              <span>{act.startAt.split("T")[1]?.substring(0, 5) || hour}</span>
                              <span className="font-semibold">{act.ownerName.split(" ")[0]}</span>
                            </div>
                          </div>
                        ))}

                        {/* Tasks */}
                        {slotTasks.map((tsk) => (
                          <div
                            key={tsk.id}
                            data-task-id={tsk.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItemDetail({ item: tsk, itemType: "task" });
                            }}
                            className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-[11px] space-y-0.5 shadow-2xs hover:scale-102 transition-transform"
                          >
                            <div className="flex items-center gap-1 font-bold">
                              <CheckSquare className="h-3 w-3 text-amber-600" />
                              <span className="truncate">{tsk.title}</span>
                            </div>
                            <div className="flex items-center justify-between text-[9px] opacity-80">
                              <span>Tarefa · {tsk.dueTime || hour}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. DAY VIEW */}
      {viewMode === "day" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Agenda do Dia: {currentDate.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </h3>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {hours.map((hour) => {
              const hourActs = combinedAgendaItems.activities.filter((a) => {
                if (!a.startAt.startsWith(currentDateISO)) return false;
                const aTime = a.startAt.includes("T") ? a.startAt.split("T")[1].substring(0, 5) : "";
                return aTime.substring(0, 2) === hour.substring(0, 2);
              });

              const hourTasks = combinedAgendaItems.tasks.filter((t) => {
                if (t.dueDate !== currentDateISO) return false;
                const tTime = t.dueTime || "12:00";
                return tTime.substring(0, 2) === hour.substring(0, 2);
              });

              return (
                <div key={hour} className="py-3 flex items-start gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-xl">
                  <div className="w-16 text-xs font-extrabold text-slate-400 pt-1 shrink-0">
                    {hour}
                  </div>

                  <div className="flex-1 space-y-2">
                    {hourActs.length === 0 && hourTasks.length === 0 ? (
                      <button
                        onClick={() => {
                          setSelectedSlot({ date: currentDateISO, time: hour });
                          setEditingActivity(null);
                          setShowActivityModal(true);
                        }}
                        className="text-xs text-slate-400 hover:text-indigo-600 font-medium border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-2 w-full text-left transition-colors"
                      >
                        + Clique para agendar compromisso às {hour}
                      </button>
                    ) : (
                      <>
                        {hourActs.map((act) => (
                          <div
                            key={act.id}
                            onClick={() => setSelectedItemDetail({ item: act, itemType: "activity" })}
                            className="p-3 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-xl flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/60">
                                {getActivityIcon(act.type)}
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                  {act.title}
                                </h4>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                  {act.ownerName} {act.location && `· ${act.location}`}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                              {act.startAt.split("T")[1]?.substring(0, 5) || hour}
                            </span>
                          </div>
                        ))}

                        {hourTasks.map((tsk) => (
                          <div
                            key={tsk.id}
                            onClick={() => setSelectedItemDetail({ item: tsk, itemType: "task" })}
                            className="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/60">
                                <CheckSquare className="h-4 w-4 text-amber-600" />
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                  {tsk.title} (Tarefa)
                                </h4>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                  {tsk.ownerName}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-semibold text-amber-600">
                              {tsk.dueTime || hour}
                            </span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. MONTH VIEW */}
      {viewMode === "month" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          {/* Days of week header */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-center py-2 text-[11px] font-bold text-slate-400 uppercase">
            <div>Seg</div>
            <div>Ter</div>
            <div>Qua</div>
            <div>Qui</div>
            <div>Sex</div>
            <div>Sáb</div>
            <div>Dom</div>
          </div>

          <div className="grid grid-cols-7 divide-x divide-y divide-slate-200 dark:divide-slate-800 min-h-[500px]">
            {monthDays.map((cell, idx) => {
              const cellIso = formatDateISO(cell.date);
              const isToday = cellIso === getLocalDateString();

              const dayActs = combinedAgendaItems.activities.filter((a) =>
                a.startAt.startsWith(cellIso)
              );
              const dayTasks = combinedAgendaItems.tasks.filter(
                (t) => t.dueDate === cellIso
              );

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedSlot({ date: cellIso });
                    setEditingActivity(null);
                    setShowActivityModal(true);
                  }}
                  className={`p-2 min-h-[90px] hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 transition-colors cursor-pointer space-y-1 ${
                    !cell.isCurrentMonth ? "bg-slate-50/40 dark:bg-slate-900/40 text-slate-300" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? "bg-indigo-600 text-white"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {cell.date.getDate()}
                    </span>
                    {(dayActs.length > 0 || dayTasks.length > 0) && (
                      <span className="text-[10px] font-extrabold text-indigo-500">
                        {dayActs.length + dayTasks.length}
                      </span>
                    )}
                  </div>

                  {/* Compact items */}
                  {dayActs.slice(0, 2).map((a) => (
                    <div
                      key={a.id}
                      data-activity-id={a.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItemDetail({ item: a, itemType: "activity" });
                      }}
                      className="p-1 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200 text-[10px] font-bold truncate"
                    >
                      {a.title}
                    </div>
                  ))}

                  {dayTasks.slice(0, 2).map((t) => (
                    <div
                      key={t.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItemDetail({ item: t, itemType: "task" });
                      }}
                      className="p-1 rounded bg-amber-50 dark:bg-amber-950 text-amber-900 dark:text-amber-200 text-[10px] font-bold truncate"
                    >
                      ✓ {t.title}
                    </div>
                  ))}

                  {dayActs.length + dayTasks.length > 4 && (
                    <div className="text-[9px] font-bold text-slate-400">
                      +{dayActs.length + dayTasks.length - 4} mais
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. LIST VIEW */}
      {viewMode === "list" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Lista Cronológica de Compromissos e Tarefas
          </h3>

          <div className="space-y-3">
            {combinedAgendaItems.activities.map((a) => (
              <div
                key={a.id}
                onClick={() => setSelectedItemDetail({ item: a, itemType: "activity" })}
                className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:border-indigo-500 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600">
                    {getActivityIcon(a.type)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {a.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {a.ownerName} {a.entityName && `· ${a.entityName}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{a.startAt.replace("T", " ")}</span>
                </div>
              </div>
            ))}

            {combinedAgendaItems.tasks.map((t) => (
              <div
                key={t.id}
                data-task-id={t.id}
                onClick={() => setSelectedItemDetail({ item: t, itemType: "task" })}
                className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:border-amber-500 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600">
                    <CheckSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      [Tarefa] {t.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Resp: {t.ownerName} {t.entityName && `· ${t.entityName}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/80 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  <span>Prazo: {t.dueDate} {t.dueTime || ""}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Form Modal */}
      <ActivityFormModal
        isOpen={showActivityModal}
        activityToEdit={editingActivity}
        initialDate={selectedSlot?.date}
        initialTime={selectedSlot?.time}
        onClose={() => {
          setShowActivityModal(false);
          setEditingActivity(null);
          setSelectedSlot(null);
        }}
        onSave={handleSaveActivity}
      />

      {/* Detail Popover / Modal when clicking an Item */}
      {selectedItemDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                {selectedItemDetail.itemType === "activity" ? "Compromisso de Agenda" : "Tarefa Operacional"}
              </span>
              <button
                onClick={() => setSelectedItemDetail(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                {selectedItemDetail.item.title}
              </h3>
              {selectedItemDetail.item.description && (
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {selectedItemDetail.item.description}
                </p>
              )}
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-indigo-500" />
                <span>Responsável: <strong>{selectedItemDetail.item.ownerName}</strong></span>
              </div>

              {"startAt" in selectedItemDetail.item && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-500" />
                  <span>Data/Hora: <strong>{selectedItemDetail.item.startAt.replace("T", " ")}</strong></span>
                </div>
              )}

              {"dueDate" in selectedItemDetail.item && (
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-indigo-500" />
                  <span>Prazo: <strong>{selectedItemDetail.item.dueDate} {selectedItemDetail.item.dueTime || ""}</strong></span>
                </div>
              )}

              {selectedItemDetail.item.entityName && (
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-indigo-500" />
                  <span>Vinculado a: <strong>{selectedItemDetail.item.entityName}</strong></span>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              {selectedItemDetail.itemType === "activity" && (
                <>
                  <button
                    onClick={handleCompleteSelectedActivity}
                    className="px-4 py-2 bg-emerald-600 rounded-xl text-xs font-bold text-white"
                  >
                    Marcar concluída
                  </button>
                  <button
                    onClick={handleCancelSelectedActivity}
                    className="px-4 py-2 bg-rose-600 rounded-xl text-xs font-bold text-white"
                  >
                    Cancelar atividade
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedItemDetail(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
