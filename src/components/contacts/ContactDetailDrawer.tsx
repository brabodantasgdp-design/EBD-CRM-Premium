import React, { useState } from "react";
import { CopilotEntityButton } from "../copilot/CopilotEntityButton";
import {
  X,
  User,
  Building2,
  Mail,
  Phone,
  Calendar,
  Tag as TagIcon,
  Briefcase,
  CheckSquare,
  Clock,
  FileText,
  PlusCircle,
  Edit,
  Sparkles,
  ArrowRight,
  Send,
  Plus,
  Check,
  AlertCircle,
  PhoneCall,
  Video,
  FilePlus,
  Info,
} from "lucide-react";
import { ContactItem, ContactActivity, ContactNote, ContactDeal } from "../../types/crm";
import { ContactStatusBadge } from "./ContactStatusBadge";
import { CreateDealFromContactModal } from "./CreateDealFromContactModal";
import { useCRM } from "../../context/CRMContext";
import { getLocalDateString, getLocalDateTimeISO } from "../../utils/formatters";

interface ContactDetailDrawerProps {
  contact: ContactItem;
  onClose: () => void;
  onEditContact: (contact: ContactItem) => void;
  onUpdateContact: (updatedContact: ContactItem) => void;
  onOpenCompanyQuickView: (companyName: string, companyData?: ContactItem["companyData"]) => void;
  onShowToast: (msg: string) => void;
}

export const ContactDetailDrawer: React.FC<ContactDetailDrawerProps> = ({
  contact,
  onClose,
  onEditContact,
  onUpdateContact,
  onOpenCompanyQuickView,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "activities" | "deals" | "tasks" | "notes">("overview");

  // Local state for adding tasks, notes, activities, deals inside drawer
  const [showAddActivityModal, setShowAddActivityModal] = useState(false);
  const [showAddDealModal, setShowAddDealModal] = useState(false);

  // New Activity form state
  const [activityType, setActivityType] = useState<ContactActivity["type"]>("call");
  const [activityTitle, setActivityTitle] = useState("");
  const [activityDesc, setActivityDesc] = useState("");

  // New Task form state
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState(getLocalDateString());
  const [taskPriority, setTaskPriority] = useState<"alta" | "media" | "baixa">("alta");

  // New Note state
  const [newNoteContent, setNewNoteContent] = useState("");

  const {
    addTask,
    addActivity,
    completeTask,
    reopenTask,
    getEntityTasks,
    getEntityActivities,
  } = useCRM();

  const activities = getEntityActivities("contact", contact.id).map((activity) => ({
    ...activity,
    authorName: activity.ownerName,
    createdAt: activity.startAt.replace("T", " "),
    relatedDealName: undefined,
  }));
  const tasks = getEntityTasks("contact", contact.id).map((task) => ({
    ...task,
    completed: task.status === "completed",
    assigneeName: task.ownerName,
  }));

  // Handlers
  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityTitle.trim()) return;

    addActivity({
      type: activityType === "followup" ? "follow_up" : activityType,
      title: activityTitle.trim(),
      description: activityDesc.trim(),
      ownerId: contact.ownerId,
      ownerName: contact.ownerName,
      startAt: getLocalDateTimeISO(),
      status: "completed",
      entityType: "contact",
      entityId: contact.id,
      entityName: contact.fullName,
    });
    setActivityTitle("");
    setActivityDesc("");
    setShowAddActivityModal(false);
    onShowToast("Atividade registrada com sucesso!");
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const priority = taskPriority === "alta" ? "high" : taskPriority === "baixa" ? "low" : "medium";
    addTask({
      title: taskTitle.trim(),
      dueDate: taskDueDate,
      ownerId: contact.ownerId,
      ownerName: contact.ownerName,
      priority,
      entityType: "contact",
      entityId: contact.id,
      entityName: contact.fullName,
    });
    setTaskTitle("");
    onShowToast("Tarefa criada para o contato!");
  };

  const handleToggleTask = (taskId: string) => {
    const task = tasks.find((item) => item.id === taskId);
    if (task) {
      if (task.completed) reopenTask(taskId);
      else completeTask(taskId);
    }
    onShowToast("Status da tarefa atualizado!");
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;

    const newNote: ContactNote = {
      id: `nt-${Date.now()}`,
      authorName: contact.ownerName,
      content: newNoteContent.trim(),
      createdAt: "Hoje às " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedNotes = [newNote, ...(contact.notesList || [])];
    onUpdateContact({ ...contact, notesList: updatedNotes });
    setNewNoteContent("");
    onShowToast("Nota adicionada ao contato!");
  };

  const { addDeal } = useCRM();

  const handleSaveDeal = (newDeal: ContactDeal) => {
    addDeal({
      ...newDeal,
      contactId: contact.id,
      contactName: contact.fullName,
      companyId: contact.companyId,
      companyName: contact.companyName,
    });
    setShowAddDealModal(false);
    onShowToast("Negócio vinculado criado com sucesso!");
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl border-l border-slate-200 flex flex-col min-w-0 animate-in slide-in-from-right duration-300">
        
        {/* Drawer Header */}
        <div className="p-4 sm:p-6 bg-slate-900 text-white shrink-0 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white font-extrabold text-lg flex items-center justify-center border border-indigo-400/40 shadow-inner shrink-0">
                {contact.firstName.charAt(0)}
                {contact.lastName ? contact.lastName.charAt(0) : ""}
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  {contact.fullName}
                  <ContactStatusBadge status={contact.lifecycleStatus} archived={!!contact.archivedAt} />
                </h2>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300 mt-1">
                  <span>{contact.jobTitle || "Sem cargo"}</span>
                  {contact.companyName && (
                    <>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => onOpenCompanyQuickView(contact.companyName!, contact.companyData)}
                        className="text-indigo-300 hover:text-indigo-200 underline font-semibold flex items-center gap-1"
                      >
                        <Building2 className="h-3 w-3" />
                        <span>{contact.companyName}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Action Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800 text-xs">
            <CopilotEntityButton entityType="contact" entityId={contact.id} />
            <button
              onClick={() => onEditContact(contact)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Edit className="h-3.5 w-3.5 text-indigo-400" />
              <span>Editar</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("tasks");
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5 transition-colors"
            >
              <CheckSquare className="h-3.5 w-3.5 text-blue-400" />
              <span>Criar Tarefa</span>
            </button>

            <button
              onClick={() => setShowAddActivityModal(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5 transition-colors"
            >
              <PlusCircle className="h-3.5 w-3.5 text-emerald-400" />
              <span>Registrar Atividade</span>
            </button>

            <button
              onClick={() => setShowAddDealModal(true)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all ml-auto"
            >
              <Briefcase className="h-3.5 w-3.5" />
              <span>Criar Negócio</span>
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 border-b border-slate-800 pt-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-3 py-2 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                activeTab === "overview"
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab("activities")}
              className={`px-3 py-2 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "activities"
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Atividades
              {activities.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px]">
                  {activities.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("deals")}
              className={`px-3 py-2 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "deals"
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Negócios
              {contact.deals && contact.deals.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-950 text-amber-300 text-[10px]">
                  {contact.deals.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("tasks")}
              className={`px-3 py-2 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "tasks"
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Tarefas
              {tasks.filter((t) => !t.completed).length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-indigo-950 text-indigo-300 text-[10px]">
                  {tasks.filter((t) => !t.completed).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`px-3 py-2 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "notes"
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Notas
              {contact.notesList && contact.notesList.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px]">
                  {contact.notesList.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs text-slate-700">
          
          {/* TAB 1: VISÃO GERAL */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              {/* Lead Origin Banner if converted */}
              {contact.convertedFromLeadId && (
                <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-between text-indigo-900">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" />
                    <div>
                      <span className="font-bold block">Origem do Contato: Lead Convertido</span>
                      <span className="text-[11px] text-indigo-700">
                        Originado do lead em {contact.convertedFromLeadDate || "08/08/2026"}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-500 bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                    ID: {contact.convertedFromLeadId}
                  </span>
                </div>
              )}

              {/* Grid 2 Cols: Contact Info & Relationship */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Contact Data Box */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <User className="h-4 w-4 text-indigo-600" />
                    <span>Dados de Contato</span>
                  </h4>
                  <div className="space-y-2 text-slate-700">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">E-mail Comercial:</span>
                      <span className="font-bold text-slate-900">{contact.email || "Não informado"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">Celular / WhatsApp:</span>
                      <span className="font-semibold text-slate-800">{contact.mobilePhone || "Não informado"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">Telefone Fixo:</span>
                      <span className="font-semibold text-slate-800">{contact.phone || "Não informado"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">Cargo:</span>
                      <span className="font-semibold text-slate-800">{contact.jobTitle || "Não informado"}</span>
                    </div>
                  </div>
                </div>

                {/* Relationship Box */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-indigo-600" />
                    <span>Relacionamento</span>
                  </h4>
                  <div className="space-y-2 text-slate-700">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">Responsável:</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <img
                          src={contact.ownerAvatar}
                          alt={contact.ownerName}
                          className="h-5 w-5 rounded-full object-cover"
                        />
                        <span className="font-bold text-slate-900">{contact.ownerName}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">Origem de Cadastro:</span>
                      <span className="font-semibold text-slate-800">{contact.source || "Manual"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">Data de Criação:</span>
                      <span className="font-medium text-slate-700">{contact.createdAt}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">Última Atualização:</span>
                      <span className="font-medium text-slate-700">{contact.updatedAt}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Linked Company Card */}
              {contact.companyName && (
                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Empresa Vinculada</span>
                      <h4 className="font-bold text-slate-900 text-sm">{contact.companyName}</h4>
                      <p className="text-[11px] text-slate-500">
                        {contact.companyData?.segment || "Tecnologia B2B"} • {contact.companyData?.size || "100–250 funcionários"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenCompanyQuickView(contact.companyName!, contact.companyData)}
                    className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors border border-indigo-200"
                  >
                    Ver Empresa
                  </button>
                </div>
              )}

              {/* Tags Section */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <TagIcon className="h-4 w-4 text-indigo-600" />
                  <span>Etiquetas / Tags</span>
                </h4>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {contact.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-semibold text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                  {contact.tags.length === 0 && (
                    <span className="text-slate-400 italic">Nenhuma tag associada</span>
                  )}
                </div>
              </div>

              {/* Custom Fields Section */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  CAMPOS PERSONALIZADOS
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {(contact.customFields || [
                    { label: "Área de decisão", value: "Comercial / Vendas" },
                    { label: "Nível de influência", value: "Decisor Final" },
                    { label: "Preferência de contato", value: "E-mail & WhatsApp" },
                    { label: "Região", value: "Sudeste (São Paulo)" },
                  ]).map((cf, i) => (
                    <div key={i} className="p-2 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold block">{cf.label}</span>
                      <span className="font-bold text-slate-900">{cf.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ATIVIDADES */}
          {activeTab === "activities" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h4 className="font-bold text-slate-900 text-sm">Timeline de Atividades</h4>
                <button
                  onClick={() => setShowAddActivityModal(true)}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-2xs flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Registrar Atividade</span>
                </button>
              </div>

              <div className="space-y-3">
                {activities.map((act) => (
                  <div key={act.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        {act.type === "call" && <PhoneCall className="h-3.5 w-3.5 text-blue-600" />}
                        {act.type === "meeting" && <Video className="h-3.5 w-3.5 text-purple-600" />}
                        {act.type === "email" && <Mail className="h-3.5 w-3.5 text-emerald-600" />}
                        {act.type === "note" && <FileText className="h-3.5 w-3.5 text-amber-600" />}
                        {act.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">{act.createdAt}</span>
                    </div>
                    {act.description && (
                      <p className="text-slate-600 text-xs leading-relaxed">{act.description}</p>
                    )}
                    <div className="pt-1 text-[10px] text-slate-500 font-medium flex items-center justify-between">
                      <span>Registrado por: {act.authorName}</span>
                      {act.relatedDealName && (
                        <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md">
                          {act.relatedDealName}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {activities.length === 0 && (
                  <p className="text-center py-8 text-slate-400 italic">
                    Nenhuma atividade registrada para este contato.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: NEGÓCIOS */}
          {activeTab === "deals" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Oportunidades & Negócios Vinculados</h4>
                  <p className="text-[11px] text-slate-500">Relacionamentos comerciais de vendas</p>
                </div>
                <button
                  onClick={() => setShowAddDealModal(true)}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-2xs flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Criar Negócio</span>
                </button>
              </div>

              <div className="space-y-3">
                {(contact.deals || []).map((deal) => (
                  <div key={deal.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h5 className="font-bold text-slate-900 text-xs">{deal.name}</h5>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Pipeline: {deal.pipelineName} • Etapa: <strong className="text-indigo-600">{deal.stageName}</strong>
                        </p>
                      </div>
                      <span className="font-black text-slate-900 text-sm bg-slate-100 px-2.5 py-1 rounded-xl">
                        {deal.formattedValue}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                      <span>Responsável: <strong>{deal.assigneeName}</strong></span>
                      <span>Fechamento previsto: <strong>{deal.expectedCloseDate}</strong></span>
                    </div>
                  </div>
                ))}

                {(!contact.deals || contact.deals.length === 0) && (
                  <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <Briefcase className="h-8 w-8 text-slate-300 mx-auto" />
                    <p className="font-bold text-slate-700 text-xs">Nenhum negócio vinculado no momento.</p>
                    <button
                      type="button"
                      onClick={() => setShowAddDealModal(true)}
                      className="px-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200"
                    >
                      Criar Primeiro Negócio
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: TAREFAS */}
          {activeTab === "tasks" && (
            <div className="space-y-4">
              <form onSubmit={handleAddTask} className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl space-y-2">
                <span className="font-bold text-indigo-900 text-xs block">Agendar Nova Tarefa</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="Ex: Enviar proposta atualizada por e-mail..."
                    className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-2xs"
                  >
                    Adicionar
                  </button>
                </div>
              </form>

              <div className="space-y-2">
                <h5 className="font-bold text-slate-900 text-xs">Tarefas do Contato</h5>
                {tasks.map((tsk) => (
                  <div
                    key={tsk.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                      tsk.completed ? "bg-slate-50 border-slate-200 text-slate-400 line-through" : "bg-white border-slate-200 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        onClick={() => handleToggleTask(tsk.id)}
                        className={`p-1 rounded-lg border transition-all ${
                          tsk.completed ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-slate-300 text-transparent"
                        }`}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <span className="font-semibold truncate text-xs">{tsk.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium shrink-0">
                      Prazo: {tsk.dueDate}
                    </span>
                  </div>
                ))}

                {tasks.length === 0 && (
                  <p className="text-center py-6 text-slate-400 italic">
                    Nenhuma tarefa agendada.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: NOTAS */}
          {activeTab === "notes" && (
            <div className="space-y-4">
              <form onSubmit={handleAddNote} className="space-y-2">
                <textarea
                  rows={3}
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Escreva uma nota interna sobre o contato..."
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:bg-white focus:border-indigo-600"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-2xs flex items-center gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Salvar Nota</span>
                  </button>
                </div>
              </form>

              <div className="space-y-3">
                {(contact.notesList || []).map((note) => (
                  <div key={note.id} className="p-3.5 bg-amber-50/50 border border-amber-200/80 rounded-2xl space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-amber-900 font-bold">
                      <span>{note.authorName}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{note.createdAt}</span>
                    </div>
                    <p className="text-xs text-slate-800 leading-relaxed font-medium">{note.content}</p>
                  </div>
                ))}

                {(!contact.notesList || contact.notesList.length === 0) && (
                  <p className="text-center py-6 text-slate-400 italic">
                    Nenhuma nota adicionada ainda.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Activity Log */}
      {showAddActivityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm">Registrar Atividade Comercial</h4>
              <button onClick={() => setShowAddActivityModal(false)}>
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleAddActivity} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipo de Atividade</label>
                <select
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value as ContactActivity["type"])}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="call">Ligação Realizada</option>
                  <option value="meeting">Reunião / Videochamada</option>
                  <option value="email">Registro de E-mail enviado</option>
                  <option value="followup">Follow-up Comercial</option>
                  <option value="note">Anotação Geral</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Título / Resumo *</label>
                <input
                  type="text"
                  required
                  value={activityTitle}
                  onChange={(e) => setActivityTitle(e.target.value)}
                  placeholder="Ex: Alinhamento de proposta B2B"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descrição / Detalhes</label>
                <textarea
                  rows={3}
                  value={activityDesc}
                  onChange={(e) => setActivityDesc(e.target.value)}
                  placeholder="Anotações relevantes da conversa..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddActivityModal(false)}
                  className="px-3 py-2 font-bold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-indigo-600 rounded-xl shadow-2xs"
                >
                  Salvar Atividade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Create Deal */}
      {showAddDealModal && (
        <CreateDealFromContactModal
          contact={contact}
          onClose={() => setShowAddDealModal(false)}
          onSaveDeal={handleSaveDeal}
        />
      )}
    </div>
  );
};
