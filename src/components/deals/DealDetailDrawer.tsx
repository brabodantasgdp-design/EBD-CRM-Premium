import React, { useEffect, useState } from "react";
import {
  X,
  Building2,
  User,
  Calendar,
  Clock,
  Tag,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Plus,
  Edit2,
  RotateCcw,
  Phone,
  Video,
  Mail,
  FileText,
  Package,
  Layers,
  History,
  CheckSquare,
  AlertCircle,
  Briefcase,
  Trash2,
  Archive,
} from "lucide-react";
import {
  DealItem,
  DealProduct,
  DealNote,
} from "../../types/crm";
import { useCRM } from "../../context/CRMContext";
import { formatDateToISO, getLocalDateString, getLocalDateTimeISO } from "../../utils/formatters";

interface DealDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  deal: DealItem | null;
  onEditDeal: (deal: DealItem) => void;
  onMarkWon: (deal: DealItem) => void;
  onMarkLost: (deal: DealItem) => void;
  onReopen: (deal: DealItem) => void;
  onArchiveDeal?: (deal: DealItem) => void;
}

export const DealDetailDrawer: React.FC<DealDetailDrawerProps> = ({
  isOpen,
  onClose,
  deal,
  onEditDeal,
  onMarkWon,
  onMarkLost,
  onReopen,
  onArchiveDeal,
}) => {
  const {
    updateDeal,
    addTask,
    addActivity,
    completeTask,
    reopenTask,
    getEntityTasks,
    getEntityActivities,
  } = useCRM();
  const [activeTab, setActiveTab] = useState<
    "overview" | "activities" | "tasks" | "products" | "notes" | "history"
  >("overview");

  // Activity Form state
  const [actType, setActType] = useState<
    "call" | "meeting" | "email" | "followup" | "note"
  >("call");
  const [actTitle, setActTitle] = useState("");
  const [actDesc, setActDesc] = useState("");

  // Task Form state
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskPriority, setTaskPriority] = useState<"alta" | "media" | "baixa">("media");

  // Product Form state
  const [prodName, setProdName] = useState("");
  const [prodQty, setProdQty] = useState("1");
  const [prodPrice, setProdPrice] = useState("");
  const [dealProposals, setDealProposals] = useState<Array<{ id: string; number: string; title: string; status: string; total: number }>>([]);

  // Note Form state
  const [noteContent, setNoteContent] = useState("");

  useEffect(() => {
    if (!isOpen || !deal) {
      setDealProposals([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/commercial/proposals?dealId=${deal.id}`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<{ proposals: Array<{ id: string; number: string; title: string; status: string; total: number }> }> : Promise.reject(new Error("proposal_load")))
      .then((payload) => { if (!cancelled) setDealProposals(payload.proposals ?? []); })
      .catch(() => { if (!cancelled) setDealProposals([]); });
    return () => { cancelled = true; };
  }, [deal, isOpen]);

  if (!isOpen || !deal) return null;

  const activities = getEntityActivities("deal", deal.id).map((activity) => ({
    ...activity,
    authorName: activity.ownerName,
    createdAt: activity.startAt.replace("T", " "),
  }));
  const tasks = getEntityTasks("deal", deal.id).map((task) => ({
    ...task,
    completed: task.status === "completed",
    assigneeName: task.ownerName,
  }));
  // Produtos legados em DealItem são deprecated; a fonte operacional é proposal_items.
  const products: DealProduct[] = [];
  const notes = deal.notes || [];
  const stageHistory = deal.stageHistory || [];

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(val);

  // Calculate Weighted Forecast
  const prob = deal.probability ?? 50;
  const weightedForecast = (deal.value || 0) * (prob / 100);

  // Products Total
  const productsTotal = products.reduce(
    (acc, p) => acc + (p.totalPrice || p.quantity * p.unitPrice),
    0
  );

  // 1. Add Activity Handler
  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actTitle.trim()) return;

    addActivity({
      type: actType === "followup" ? "follow_up" : actType,
      title: actTitle.trim(),
      description: actDesc.trim(),
      ownerId: deal.ownerId || "usr-1",
      ownerName: deal.ownerName || "Mariana Costa",
      startAt: getLocalDateTimeISO(),
      status: "completed",
      entityType: "deal",
      entityId: deal.id,
      entityName: deal.name,
    });

    setActTitle("");
    setActDesc("");
  };

  // 2. Add Task Handler
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const priority = taskPriority === "alta" ? "high" : taskPriority === "baixa" ? "low" : "medium";
    addTask({
      title: taskTitle.trim(),
      dueDate: formatDateToISO(taskDueDate || getLocalDateString()),
      ownerId: deal.ownerId || "usr-1",
      ownerName: deal.ownerName || "Mariana Costa",
      priority,
      entityType: "deal",
      entityId: deal.id,
      entityName: deal.name,
    });

    setTaskTitle("");
    setTaskDueDate("");
  };

  const handleToggleTask = (taskId: string) => {
    const task = tasks.find((item) => item.id === taskId);
    if (task) {
      if (task.completed) reopenTask(taskId);
      else completeTask(taskId);
    }
  };

  // 3. Add Product Handler
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    // Produtos agora são persistidos em proposal_items; não duplicar estado em Deal.
  };

  const handleRemoveProduct = (prodId: string) => {
    void prodId;
  };

  const handleSyncDealValueFromProducts = () => {
    if (productsTotal <= 0) return;
    updateDeal(deal.id, {
      value: productsTotal,
      formattedValue: formatCurrency(productsTotal),
    });
  };

  // 4. Add Note Handler
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    const newNote: DealNote = {
      id: `not-${Date.now()}`,
      authorName: deal.ownerName || "Mariana Costa",
      content: noteContent.trim(),
      createdAt: `${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
    };

    const updatedNotes = [newNote, ...notes];
    updateDeal(deal.id, { notes: updatedNotes });

    setNoteContent("");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative w-full max-w-3xl bg-white shadow-2xl border-l border-slate-200 h-full flex flex-col z-10 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/70 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs font-bold text-indigo-700 px-2.5 py-0.5 bg-indigo-50 border border-indigo-200/80 rounded-md">
                  {deal.stageName}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  {deal.pipelineName}
                </span>

                {deal.status === "open" && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    Aberto
                  </span>
                )}
                {deal.status === "won" && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Ganho
                  </span>
                )}
                {deal.status === "lost" && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Perdido
                  </span>
                )}
              </div>

              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {deal.name}
              </h2>

              <div className="text-2xl font-black text-slate-900 mt-1">
                {deal.formattedValue || formatCurrency(deal.value)}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Top Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap mt-4 pt-3 border-t border-slate-200/60 text-xs">
            <button
              type="button"
              onClick={() => onEditDeal(deal)}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Editar</span>
            </button>

            {onArchiveDeal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onArchiveDeal(deal);
                }}
                className="px-3 py-1.5 bg-white border border-amber-200 hover:bg-amber-50 text-amber-700 font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Archive className="w-3.5 h-3.5 text-amber-600" />
                <span>Arquivar</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab("activities")}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 text-indigo-600" />
              <span>Atividade</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("tasks")}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5 text-amber-600" />
              <span>Tarefa</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("notes")}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-slate-600" />
              <span>Nota</span>
            </button>

            <div className="ml-auto flex items-center gap-1.5">
              {deal.status === "open" ? (
                <>
                  <button
                    type="button"
                    onClick={() => onMarkWon(deal)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Ganho</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onMarkLost(deal)}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Perdido</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => onReopen(deal)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reabrir</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-slate-200 bg-white px-4 overflow-x-auto shrink-0">
          {[
            { id: "overview", label: "Visão Geral", icon: Briefcase },
            {
              id: "activities",
              label: `Atividades (${activities.length})`,
              icon: Phone,
            },
            { id: "tasks", label: `Tarefas (${tasks.length})`, icon: CheckSquare },
            {
              id: "products",
              label: `Produtos (${products.length})`,
              icon: Package,
            },
            { id: "notes", label: `Notas (${notes.length})`, icon: FileText },
            { id: "history", label: "Histórico", icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "border-indigo-600 text-indigo-600 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: VISÃO GERAL */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Relacionamentos */}
              <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Relacionamentos B2B
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                    <span className="text-[11px] font-medium text-slate-400 block mb-1">
                      Empresa
                    </span>
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                      <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="truncate">
                        {deal.companyName || "Nenhuma"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                    <span className="text-[11px] font-medium text-slate-400 block mb-1">
                      Contato Principal
                    </span>
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                      <User className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="truncate">
                        {deal.contactName || "Nenhum"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                    <span className="text-[11px] font-medium text-slate-400 block mb-1">
                      Responsável Comercial
                    </span>
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                      <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-[10px] flex items-center justify-center shrink-0">
                        {(deal.ownerName || "U").charAt(0)}
                      </div>
                      <span className="truncate">{deal.ownerName}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informações Comerciais */}
              <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Resumo Comercial
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                    <span className="text-[11px] text-slate-400 block mb-0.5">
                      Valor do Negócio
                    </span>
                    <span className="text-sm font-black text-slate-900">
                      {deal.formattedValue || formatCurrency(deal.value)}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                    <span className="text-[11px] text-slate-400 block mb-0.5">
                      Probabilidade
                    </span>
                    <span className="text-sm font-bold text-indigo-700">
                      {prob}%
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                    <span className="text-[11px] text-slate-400 block mb-0.5">
                      Forecast Ponderado
                    </span>
                    <span className="text-sm font-bold text-purple-700">
                      {formatCurrency(weightedForecast)}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                    <span className="text-[11px] text-slate-400 block mb-0.5">
                      Previsão Fechamento
                    </span>
                    <span className="text-sm font-bold text-slate-800 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {deal.expectedCloseDate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Motivo de Perda se aplicável */}
              {deal.status === "lost" && deal.lossReason && (
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 space-y-1">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Motivo da Perda: {deal.lossReason}</span>
                  </div>
                  {deal.lossNote && (
                    <p className="text-xs text-rose-700 pl-6">{deal.lossNote}</p>
                  )}
                </div>
              )}

              {/* Tags & Origem */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Tags & Origem
                </h4>
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  {deal.source && (
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-semibold rounded-lg">
                      Origem: {deal.source}
                    </span>
                  )}
                  {deal.tags &&
                    deal.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-semibold rounded-lg flex items-center gap-1"
                      >
                        <Tag className="w-3 h-3" />
                        {t}
                      </span>
                    ))}
                </div>
              </div>

              {/* Campos Personalizados */}
              {deal.customFields && deal.customFields.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Campos Personalizados
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {deal.customFields.map((cf, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80"
                      >
                        <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                          {cf.label}
                        </span>
                        <span className="font-bold text-slate-800">
                          {cf.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ATIVIDADES */}
          {activeTab === "activities" && (
            <div className="space-y-6">
              {/* Form to log activity */}
              <form
                onSubmit={handleAddActivity}
                className="pointer-events-none p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3 opacity-60"
              >
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-indigo-600" />
                  Registrar Nova Atividade
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setActType("call")}
                    className={`py-1.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer ${
                      actType === "call" ? "bg-indigo-600 text-white" : "text-slate-600"
                    }`}
                  >
                    <Phone className="w-3 h-3" /> Call
                  </button>
                  <button
                    type="button"
                    onClick={() => setActType("meeting")}
                    className={`py-1.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer ${
                      actType === "meeting" ? "bg-indigo-600 text-white" : "text-slate-600"
                    }`}
                  >
                    <Video className="w-3 h-3" /> Reunião
                  </button>
                  <button
                    type="button"
                    onClick={() => setActType("email")}
                    className={`py-1.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer ${
                      actType === "email" ? "bg-indigo-600 text-white" : "text-slate-600"
                    }`}
                  >
                    <Mail className="w-3 h-3" /> E-mail
                  </button>
                  <button
                    type="button"
                    onClick={() => setActType("followup")}
                    className={`py-1.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer ${
                      actType === "followup" ? "bg-indigo-600 text-white" : "text-slate-600"
                    }`}
                  >
                    <Clock className="w-3 h-3" /> Follow-up
                  </button>
                  <button
                    type="button"
                    onClick={() => setActType("note")}
                    className={`py-1.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer ${
                      actType === "note" ? "bg-indigo-600 text-white" : "text-slate-600"
                    }`}
                  >
                    <FileText className="w-3 h-3" /> Nota
                  </button>
                </div>

                <input
                  type="text"
                  required
                  placeholder="Título da atividade (ex: Reunião de alinhamento com CTO)"
                  value={actTitle}
                  onChange={(e) => setActTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-hidden"
                />

                <textarea
                  rows={2}
                  placeholder="Descrição ou resumo da conversa..."
                  value={actDesc}
                  onChange={(e) => setActDesc(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-hidden resize-none"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!actTitle.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    Registrar Atividade
                  </button>
                </div>
              </form>

              {/* Activity Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Histórico de Interações
                </h4>

                {activities.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">
                    Nenhuma atividade registrada ainda.
                  </p>
                ) : (
                  activities.map((act) => (
                    <div
                      key={act.id}
                      className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          {act.type === "call" && <Phone className="w-3.5 h-3.5 text-blue-600" />}
                          {act.type === "meeting" && <Video className="w-3.5 h-3.5 text-indigo-600" />}
                          {act.type === "email" && <Mail className="w-3.5 h-3.5 text-sky-600" />}
                          {act.title}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {act.createdAt}
                        </span>
                      </div>
                      {act.description && (
                        <p className="text-xs text-slate-600 leading-relaxed pt-1">
                          {act.description}
                        </p>
                      )}
                      <div className="text-[10px] text-slate-400 font-medium pt-1">
                        Por {act.authorName}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: TAREFAS */}
          {activeTab === "tasks" && (
            <div className="space-y-6">
              {/* Form to add task */}
              <form
                onSubmit={handleAddTask}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3"
              >
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-amber-600" />
                  Nova Tarefa Comercial
                </h4>

                <input
                  type="text"
                  required
                  placeholder="Título da tarefa (ex: Enviar proposta de contrato atualizada)"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-hidden"
                />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Data Limite
                    </label>
                    <input
                      type="text"
                      placeholder="DD/MM/AAAA"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Prioridade
                    </label>
                    <select
                      value={taskPriority}
                      onChange={(e) =>
                        setTaskPriority(e.target.value as typeof taskPriority)
                      }
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="baixa">Baixa</option>
                      <option value="media">Média</option>
                      <option value="alta">Alta</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={!taskTitle.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    Adicionar Tarefa
                  </button>
                </div>
              </form>

              {/* Tasks List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Lista de Tarefas do Negócio
                </h4>

                {tasks.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">
                    Nenhuma tarefa pendente neste negócio.
                  </p>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      data-task-id={task.id}
                      className={`p-3 bg-white rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                        task.completed
                          ? "bg-slate-50/60 border-slate-200 opacity-60"
                          : "border-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => handleToggleTask(task.id)}
                          className="w-4 h-4 text-indigo-600 rounded-sm cursor-pointer"
                        />
                        <div>
                          <p
                            className={`text-xs font-semibold ${
                              task.completed
                                ? "line-through text-slate-400"
                                : "text-slate-900"
                            }`}
                          >
                            {task.title}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            Prazo: {task.dueDate} • {task.assigneeName}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          task.priority === "high"
                            ? "bg-rose-100 text-rose-800"
                            : task.priority === "medium"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: PRODUTOS */}
          {activeTab === "products" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">Propostas persistentes</p>
                <p className="mt-1 text-sm text-indigo-900">Produtos comerciais deste negócio são mantidos como snapshots nas propostas.</p>
                {dealProposals.length === 0 ? <p className="mt-3 text-xs text-indigo-700">Nenhuma proposta vinculada a este negócio.</p> : <div className="mt-3 space-y-2">{dealProposals.map((proposal) => <div key={proposal.id} className="flex items-center justify-between rounded-xl bg-white p-3 text-sm"><span><b>{proposal.number}</b> · {proposal.title}</span><span className="font-bold">{formatCurrency(proposal.total)} · {proposal.status}</span></div>)}</div>}
              </div>
              {/* Form to add product */}
              <form
                onSubmit={handleAddProduct}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3"
              >
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-indigo-600" />
                  Vincular Produto ou Serviço
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      required
                      placeholder="Nome do produto/serviço (ex: Licença Pro)"
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-hidden"
                    />
                  </div>

                  <div>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="Qtd"
                      value={prodQty}
                      onChange={(e) => setProdQty(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="Preço Unitário (R$)"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-hidden"
                  />

                  <button
                    type="submit"
                    disabled={!prodName.trim() || !prodPrice}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    Gerenciado por propostas
                  </button>
                </div>
              </form>

              {/* Products Table & Totals */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Itens Vinculados ({products.length})
                  </h4>

                  {products.length > 0 && productsTotal !== deal.value && (
                    <button
                      type="button"
                      onClick={handleSyncDealValueFromProducts}
                      className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Sincronizar Valor Total do Negócio ({formatCurrency(productsTotal)})
                    </button>
                  )}
                </div>

                {products.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">
                    Nenhum produto ou serviço vinculado a este negócio.
                  </p>
                ) : (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-500">
                        <tr>
                          <th className="p-3">Item</th>
                          <th className="p-3">Qtd</th>
                          <th className="p-3">Unitário</th>
                          <th className="p-3">Total</th>
                          <th className="p-3 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {products.map((p) => (
                          <tr key={p.id}>
                            <td className="p-3 font-bold text-slate-900">
                              {p.name}
                            </td>
                            <td className="p-3 text-slate-700">{p.quantity}</td>
                            <td className="p-3 text-slate-700">
                              {formatCurrency(p.unitPrice)}
                            </td>
                            <td className="p-3 font-extrabold text-slate-900">
                              {formatCurrency(p.totalPrice || p.quantity * p.unitPrice)}
                            </td>
                            <td className="p-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveProduct(p.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-900">
                        <tr>
                          <td colSpan={3} className="p-3 text-right">
                            Total dos Itens:
                          </td>
                          <td className="p-3 font-black text-indigo-700 text-sm">
                            {formatCurrency(productsTotal)}
                          </td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: NOTAS */}
          {activeTab === "notes" && (
            <div className="space-y-6">
              {/* Form to add note */}
              <form
                onSubmit={handleAddNote}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3"
              >
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-600" />
                  Nova Nota Interna
                </h4>

                <textarea
                  rows={3}
                  required
                  placeholder="Escreva anotações internas sobre o processo de decisão do cliente..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs outline-hidden resize-none"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!noteContent.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    Salvar Nota
                  </button>
                </div>
              </form>

              {/* Notes List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Anotações Internas
                </h4>

                {notes.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">
                    Nenhuma nota registrada neste negócio.
                  </p>
                ) : (
                  notes.map((n) => (
                    <div
                      key={n.id}
                      className="p-3.5 bg-amber-50/40 border border-amber-200/60 rounded-2xl space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                        <span className="font-bold text-slate-800">
                          {n.authorName}
                        </span>
                        <span>{n.createdAt}</span>
                      </div>
                      <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {n.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 6: HISTÓRICO */}
          {activeTab === "history" && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Histórico de Etapas & Movimentações
              </h4>

              {stageHistory.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-500 text-center">
                  O negócio permanece na etapa inicial desde a criação.
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {stageHistory.map((h) => (
                    <div key={h.id} className="relative text-xs space-y-0.5">
                      <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 border-2 border-white" />
                      <div className="font-bold text-slate-900">
                        {h.changedBy} moveu de{" "}
                        <span className="text-slate-500">{h.fromStageName || "Início"}</span>{" "}
                        para <span className="text-indigo-700">{h.toStageName}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {h.changedAt}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
