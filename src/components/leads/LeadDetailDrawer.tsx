import React, { useState } from "react";
import {
  X,
  Edit3,
  ArrowUpRight,
  Plus,
  PhoneCall,
  Calendar,
  Building2,
  Mail,
  Phone,
  User,
  Clock,
  Tag,
  FileText,
  CheckSquare,
  Sparkles,
  Send,
  MessageSquare,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { LeadItem } from "../../types/crm";
import { LeadStatusBadge } from "./LeadStatusBadge";
import { LeadScoreBadge } from "./LeadScoreBadge";
import { useCRM } from "../../context/CRMContext";
import { formatDateToISO, getLocalDateString, getLocalDateTimeISO } from "../../utils/formatters";

interface LeadDetailDrawerProps {
  isOpen: boolean;
  lead: LeadItem | null;
  onClose: () => void;
  onOpenEdit: (lead: LeadItem) => void;
  onOpenConvert: (lead: LeadItem) => void;
  onUpdateLead: (updatedLead: LeadItem) => void;
}

export const LeadDetailDrawer: React.FC<LeadDetailDrawerProps> = ({
  isOpen,
  lead,
  onClose,
  onOpenEdit,
  onOpenConvert,
  onUpdateLead,
}) => {
  const [activeTab, setActiveTab] = useState<"info" | "timeline" | "tasks">("info");
  const [newActivityTitle, setNewActivityTitle] = useState("");
  const [newActivityDesc, setNewActivityDesc] = useState("");
  const [newActivityType, setNewActivityType] = useState<
    "call" | "meeting" | "email" | "note" | "followup"
  >("call");
  const [isLoggingActivity, setIsLoggingActivity] = useState(false);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDate, setNewTaskDate] = useState(getLocalDateString());

  const {
    addTask,
    addActivity,
    completeTask,
    reopenTask,
    getEntityTasks,
    getEntityActivities,
  } = useCRM();

  if (!isOpen || !lead) return null;

  const activities = getEntityActivities("lead", lead.id).map((activity) => ({
    ...activity,
    authorName: activity.ownerName,
    createdAt: activity.startAt.replace("T", " "),
  }));
  const tasks = getEntityTasks("lead", lead.id).map((task) => ({
    ...task,
    completed: task.status === "completed",
    assigneeName: task.ownerName,
  }));

  const handleLogActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityTitle.trim()) return;

    addActivity({
      type: newActivityType === "followup" ? "follow_up" : newActivityType,
      title: newActivityTitle.trim(),
      description: newActivityDesc.trim() || "Atividade registrada pelo usuário.",
      ownerId: lead.ownerId,
      ownerName: lead.ownerName,
      startAt: getLocalDateTimeISO(),
      status: "completed",
      entityType: "lead",
      entityId: lead.id,
      entityName: lead.name,
    });
    setNewActivityTitle("");
    setNewActivityDesc("");
    setIsLoggingActivity(false);
  };

  const handleToggleTask = (taskId: string) => {
    const task = tasks.find((item) => item.id === taskId);
    if (task) {
      if (task.completed) reopenTask(taskId);
      else completeTask(taskId);
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    addTask({
      title: newTaskTitle.trim(),
      dueDate: formatDateToISO(newTaskDate),
      dueTime: "10:00",
      ownerId: lead.ownerId,
      ownerName: lead.ownerName,
      priority: "medium",
      entityType: "lead",
      entityId: lead.id,
      entityName: lead.name,
    });

    setNewTaskTitle("");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-2xl bg-white shadow-2xl border-l border-slate-200 flex flex-col h-full z-10 overflow-hidden">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50/80 sticky top-0 z-10">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight truncate">
                    {lead.name}
                  </h2>
                  <LeadStatusBadge status={lead.status} />
                  <LeadScoreBadge score={lead.score} />
                </div>
                <p className="text-xs sm:text-sm text-slate-500 font-medium flex items-center gap-1.5 truncate">
                  <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>
                    {lead.company ? `${lead.company} • ` : ""}
                    {lead.jobTitle || "Sem cargo definido"}
                  </span>
                </p>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Action Toolbar */}
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-200/80">
              <button
                onClick={() => onOpenEdit(lead)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
              >
                <Edit3 className="h-3.5 w-3.5 text-slate-500" />
                <span>Editar</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("tasks");
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
              >
                <CheckSquare className="h-3.5 w-3.5 text-indigo-600" />
                <span>Criar Tarefa</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("timeline");
                  setIsLoggingActivity(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
              >
                <PhoneCall className="h-3.5 w-3.5 text-emerald-600" />
                <span>Registrar Atividade</span>
              </button>

              {lead.status !== "converted" ? (
                <button
                  onClick={() => onOpenConvert(lead)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-2xs active:scale-98 ml-auto"
                >
                  <ArrowUpRight className="h-4 w-4" />
                  <span>Converter Lead</span>
                </button>
              ) : (
                <button
                  disabled
                  title="Este lead já foi convertido em Oportunidade e não pode ser reconvertido."
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed ml-auto"
                >
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Lead Já Convertido</span>
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center border-b border-slate-200 px-4 sm:px-6 bg-white text-xs font-semibold text-slate-500">
            <button
              onClick={() => setActiveTab("info")}
              className={`py-3 px-3 border-b-2 font-bold transition-colors ${
                activeTab === "info"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent hover:text-slate-800"
              }`}
            >
              Informações do Lead
            </button>
            <button
              onClick={() => setActiveTab("timeline")}
              className={`py-3 px-3 border-b-2 font-bold transition-colors flex items-center gap-1.5 ${
                activeTab === "timeline"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent hover:text-slate-800"
              }`}
            >
              <span>Histórico e Timeline</span>
              {activities.length ? (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-[10px] text-slate-600">
                  {activities.length}
                </span>
              ) : null}
            </button>
            <button
              onClick={() => setActiveTab("tasks")}
              className={`py-3 px-3 border-b-2 font-bold transition-colors flex items-center gap-1.5 ${
                activeTab === "tasks"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent hover:text-slate-800"
              }`}
            >
              <span>Tarefas do Lead</span>
              {tasks.length ? (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-[10px] text-slate-600">
                  {tasks.length}
                </span>
              ) : null}
            </button>
          </div>

          {/* Drawer Body Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs custom-scrollbar">
            {/* TAB 1: INFORMAÇÕES DO LEAD */}
            {activeTab === "info" && (
              <div className="space-y-6">
                {/* Dados de Contato e Qualificação */}
                <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Dados do Lead</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 font-medium block text-[11px]">
                        E-mail
                      </span>
                      <span className="font-semibold text-slate-900 flex items-center gap-1 mt-0.5">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        {lead.email || "Não informado"}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 font-medium block text-[11px]">
                        Telefone / WhatsApp
                      </span>
                      <span className="font-semibold text-slate-900 flex items-center gap-1 mt-0.5">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        {lead.phone || "Não informado"}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 font-medium block text-[11px]">
                        Empresa
                      </span>
                      <span className="font-semibold text-slate-900">
                        {lead.company || "Não informada"}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 font-medium block text-[11px]">
                        Cargo
                      </span>
                      <span className="font-semibold text-slate-900">
                        {lead.jobTitle || "Não informado"}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 font-medium block text-[11px]">
                        Canal de Origem
                      </span>
                      <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md text-[11px] inline-block mt-0.5">
                        {lead.source}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 font-medium block text-[11px]">
                        Responsável
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <img
                          src={lead.ownerAvatar}
                          alt={lead.ownerName}
                          className="h-4 w-4 rounded-full"
                          referrerPolicy="no-referrer"
                        />
                        <span className="font-semibold text-slate-900">
                          {lead.ownerName}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500 font-medium block text-[11px]">
                        Data de Criação
                      </span>
                      <span className="font-semibold text-slate-900">
                        {lead.createdAt}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 font-medium block text-[11px]">
                        Última Atualização
                      </span>
                      <span className="font-semibold text-slate-900">
                        {lead.updatedAt}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Seção Tags */}
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Tags do Lead</span>
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {lead.tags.length > 0 ? (
                      lead.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold"
                        >
                          {t}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 italic">
                        Nenhuma tag vinculada
                      </span>
                    )}
                  </div>
                </div>

                {/* Seção Campos Personalizados */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Campos Personalizados</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {(
                      lead.customFields || [
                        { label: "Segmento", value: "Tecnologia" },
                        { label: "Número de funcionários", value: "250-500" },
                        { label: "Faturamento estimado", value: "R$ 20M–50M" },
                        { label: "Região", value: "Sudeste" },
                      ]
                    ).map((cf, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-100"
                      >
                        <span className="text-slate-500 font-medium block text-[10px]">
                          {cf.label}
                        </span>
                        <span className="font-bold text-slate-900 text-xs mt-0.5 block">
                          {cf.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Seção de Desqualificação se houver */}
                {lead.status === "disqualified" && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-1.5">
                    <h4 className="font-bold text-rose-900 text-xs flex items-center gap-1">
                      <span>Motivo da Desqualificação:</span>
                      <span className="underline">{lead.disqualificationReason}</span>
                    </h4>
                    {lead.disqualificationNote && (
                      <p className="text-rose-800 text-xs italic">
                        "{lead.disqualificationNote}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: HISTÓRICO E TIMELINE */}
            {activeTab === "timeline" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Linha do Tempo
                  </h3>
                  <button
                    onClick={() => setIsLoggingActivity(!isLoggingActivity)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Registrar Atividade</span>
                  </button>
                </div>

                {/* Quick Log Form */}
                {isLoggingActivity && (
                  <form
                    onSubmit={handleLogActivity}
                    className="bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-200/80 space-y-3"
                  >
                    <h4 className="font-bold text-slate-900 text-xs">
                      Registrar Nova Atividade
                    </h4>

                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={newActivityType}
                        onChange={(e) => setNewActivityType(e.target.value as any)}
                        className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold"
                      >
                        <option value="call">Ligação</option>
                        <option value="meeting">Reunião</option>
                        <option value="email">E-mail</option>
                        <option value="note">Nota de Interna</option>
                        <option value="followup">Follow-up</option>
                      </select>

                      <input
                        type="text"
                        value={newActivityTitle}
                        onChange={(e) => setNewActivityTitle(e.target.value)}
                        placeholder="Título ex: Reunião de alinhamento"
                        className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium"
                      />
                    </div>

                    <textarea
                      rows={2}
                      value={newActivityDesc}
                      onChange={(e) => setNewActivityDesc(e.target.value)}
                      placeholder="Resumo dos pontos discutidos..."
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs"
                    />

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsLoggingActivity(false)}
                        className="px-3 py-1 rounded-lg text-slate-600 font-semibold"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
                      >
                        Salvar Atividade
                      </button>
                    </div>
                  </form>
                )}

                {/* Timeline Items List */}
                <div className="relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {(
                    activities
                  ).map((act) => (
                    <div key={act.id} className="relative group">
                      {/* Timeline Dot */}
                      <span className="absolute -left-4 top-1 h-3 w-3 rounded-full border-2 border-white bg-indigo-600 shadow-xs" />

                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-900">
                            {act.title}
                          </span>
                          <span className="text-slate-400 font-mono">
                            {act.createdAt}
                          </span>
                        </div>
                        <p className="text-slate-600 text-xs leading-relaxed">
                          {act.description}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          Por {act.authorName}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: TAREFAS DO LEAD */}
            {activeTab === "tasks" && (
              <div className="space-y-4">
                {/* Form Adicionar Tarefa */}
                <form
                  onSubmit={handleAddTask}
                  className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2"
                >
                  <h4 className="font-bold text-slate-900 text-xs">
                    Agendar Nova Tarefa
                  </h4>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Ex: Enviar proposta comercial"
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs"
                    />

                    <input
                      type="text"
                      value={newTaskDate}
                      onChange={(e) => setNewTaskDate(e.target.value)}
                      placeholder="Data / Hora"
                      className="w-full sm:w-36 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs"
                    />

                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shrink-0"
                    >
                      Adicionar
                    </button>
                  </div>
                </form>

                {/* Tarefas List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Compromissos Agendados
                  </h4>

                  {tasks.length > 0 ? (
                    tasks.map((tsk) => (
                      <div
                        key={tsk.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-colors ${
                          tsk.completed
                            ? "bg-slate-50 border-slate-200 opacity-60"
                            : "bg-white border-slate-200/80 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={tsk.completed}
                            onChange={() => handleToggleTask(tsk.id)}
                            className="h-4 w-4 rounded-md border-slate-300 text-indigo-600 cursor-pointer shrink-0"
                          />
                          <div className="min-w-0">
                            <p
                              className={`font-semibold text-slate-900 ${
                                tsk.completed ? "line-through text-slate-400" : ""
                              }`}
                            >
                              {tsk.title}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {tsk.dueDate} • Responsável: {tsk.assigneeName}
                            </p>
                          </div>
                        </div>

                        {tsk.completed && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                            Concluída
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      Nenhuma tarefa pendente para este lead.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
