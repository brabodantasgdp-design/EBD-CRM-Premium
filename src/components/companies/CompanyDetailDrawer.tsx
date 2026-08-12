import React, { useState } from "react";
import {
  X,
  Building2,
  Edit2,
  UserPlus,
  Briefcase,
  CheckSquare,
  Clock,
  FileText,
  Users,
  Globe,
  Phone,
  Mail,
  MapPin,
  Tag,
  DollarSign,
  Plus,
  Send,
  Calendar,
  User,
  ExternalLink,
  ChevronRight,
  MessageSquare,
  Check,
  AlertCircle,
  Activity,
  Award,
} from "lucide-react";
import {
  CompanyItem,
  ContactDeal,
  ContactItem,
  CompanyActivity,
  CompanyNote,
} from "../../types/crm";
import { CompanyStatusBadge } from "./CompanyStatusBadge";
import { COMPANY_STATUS_CONFIG } from "../../constants/companyStatus";
import { MOCK_OWNERS } from "../../data/mockContactsData";
import { useCRM } from "../../context/CRMContext";
import { getLocalDateString } from "../../utils/formatters";

interface CompanyDetailDrawerProps {
  company: CompanyItem;
  sharedContacts: ContactItem[];
  onClose: () => void;
  onEditCompany: (company: CompanyItem) => void;
  onCreateDeal: (company: CompanyItem) => void;
  onCreateContact: (company: CompanyItem) => void;
  onUpdateCompany: (updatedCompany: CompanyItem) => void;
  onOpenContactDetail?: (contact: ContactItem) => void;
}

export const CompanyDetailDrawer: React.FC<CompanyDetailDrawerProps> = ({
  company,
  sharedContacts,
  onClose,
  onEditCompany,
  onCreateDeal,
  onCreateContact,
  onUpdateCompany,
  onOpenContactDetail,
}) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "contacts" | "deals" | "activities" | "tasks" | "notes"
  >("overview");

  const [notesList, setNotesList] = useState<CompanyNote[]>(
    company.notesList || []
  );
  const [dealsList, setDealsList] = useState<ContactDeal[]>(
    company.deals || []
  );

  // New Activity Form State
  const [newActTitle, setNewActTitle] = useState("");
  const [newActType, setNewActType] = useState<CompanyActivity["type"]>("call");
  const [newActDesc, setNewActDesc] = useState("");

  // New Task Form State
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState(getLocalDateString());
  const [newTaskPriority, setNewTaskPriority] = useState<"alta" | "media" | "baixa">("media");

  // New Note Form State
  const [newNoteText, setNewNoteText] = useState("");

  const {
    addTask,
    addActivity,
    completeTask,
    reopenTask,
    getEntityTasks,
    getEntityActivities,
  } = useCRM();

  const activities = getEntityActivities("company", company.id).map((activity) => ({
    ...activity,
    authorName: activity.ownerName,
    createdAt: activity.startAt.replace("T", " "),
  }));
  const tasks = getEntityTasks("company", company.id).map((task) => ({
    ...task,
    completed: task.status === "completed",
    assigneeName: task.ownerName,
  }));

  // Filter linked contacts from shared contacts list
  const linkedContacts = sharedContacts.filter(
    (c) =>
      c.companyId === company.id ||
      (c.companyName && c.companyName.toLowerCase() === company.name.toLowerCase())
  );

  const openDeals = dealsList.filter((d) => d.status === "open");
  const wonDeals = dealsList.filter((d) => d.status === "won");
  const pipelineVal = openDeals.reduce((acc, d) => acc + (d.value || 0), 0);
  const wonVal = wonDeals.reduce((acc, d) => acc + (d.value || 0), 0);

  // Activity submit
  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActTitle.trim()) return;

    addActivity({
      type: newActType === "followup" ? "follow_up" : newActType,
      title: newActTitle.trim(),
      description: newActDesc.trim() || "Atividade registrada via Visão 360° da empresa.",
      ownerId: company.ownerId,
      ownerName: company.ownerName,
      startAt: new Date().toISOString(),
      status: "completed",
      entityType: "company",
      entityId: company.id,
      entityName: company.name,
    });
    setNewActTitle("");
    setNewActDesc("");

  };

  // Task submit
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const priority = newTaskPriority === "alta" ? "high" : newTaskPriority === "baixa" ? "low" : "medium";
    addTask({
      title: newTaskTitle.trim(),
      dueDate: newTaskDueDate,
      ownerId: company.ownerId,
      ownerName: company.ownerName,
      priority,
      entityType: "company",
      entityId: company.id,
      entityName: company.name,
    });
    setNewTaskTitle("");
  };

  // Toggle task completed
  const handleToggleTask = (taskId: string) => {
    const task = tasks.find((item) => item.id === taskId);
    if (task) {
      if (task.completed) reopenTask(taskId);
      else completeTask(taskId);
    }
  };

  // Add Note submit
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const newNote: CompanyNote = {
      id: `nt-${Date.now()}`,
      authorName: company.ownerName,
      content: newNoteText.trim(),
      createdAt: "Hoje às " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedNotes = [newNote, ...notesList];
    setNotesList(updatedNotes);
    setNewNoteText("");

    onUpdateCompany({
      ...company,
      notesList: updatedNotes,
      updatedAt: "agora mesmo",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-900 text-white shrink-0">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-xl shadow-lg shadow-indigo-600/30 shrink-0">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h2 className="font-extrabold text-white text-xl tracking-tight truncate">
                  {company.name}
                </h2>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-300 mt-0.5">
                  <span className="truncate">{company.segment}</span>
                  {company.city && (
                    <>
                      <span>•</span>
                      <span>{company.city}, {company.state}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Subheader Info Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-2">
              <CompanyStatusBadge status={company.status} />
              {company.cnpj && (
                <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                  CNPJ: {company.cnpj}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
              <span className="text-slate-400 font-medium">Responsável:</span>
              <span className="text-indigo-300 font-bold">{company.ownerName}</span>
            </div>
          </div>

          {/* Primary Quick Action Buttons */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800">
            <button
              onClick={() => onEditCompany(company)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5 text-slate-400" />
              <span>Editar</span>
            </button>
            <button
              onClick={() => onCreateContact(company)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>+ Contato</span>
            </button>
            <button
              onClick={() => onCreateDeal(company)}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Briefcase className="h-3.5 w-3.5" />
              <span>+ Negócio</span>
            </button>
            <button
              onClick={() => setActiveTab("tasks")}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition-colors ml-auto"
            >
              <CheckSquare className="h-3.5 w-3.5 text-emerald-400" />
              <span>Tarefa</span>
            </button>
          </div>
        </div>

        {/* 6 Tabs Navigation Bar */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 flex items-center gap-1 overflow-x-auto text-xs font-bold text-slate-600 shrink-0">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === "overview"
                ? "border-indigo-600 text-indigo-600 font-extrabold bg-white"
                : "border-transparent hover:text-slate-900"
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Visão Geral</span>
          </button>

          <button
            onClick={() => setActiveTab("contacts")}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === "contacts"
                ? "border-indigo-600 text-indigo-600 font-extrabold bg-white"
                : "border-transparent hover:text-slate-900"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Contatos</span>
            <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[10px]">
              {linkedContacts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("deals")}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === "deals"
                ? "border-indigo-600 text-indigo-600 font-extrabold bg-white"
                : "border-transparent hover:text-slate-900"
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            <span>Negócios</span>
            <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded-full text-[10px]">
              {dealsList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("activities")}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === "activities"
                ? "border-indigo-600 text-indigo-600 font-extrabold bg-white"
                : "border-transparent hover:text-slate-900"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Atividades</span>
            <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[10px]">
              {activities.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("tasks")}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === "tasks"
                ? "border-indigo-600 text-indigo-600 font-extrabold bg-white"
                : "border-transparent hover:text-slate-900"
            }`}
          >
            <CheckSquare className="h-3.5 w-3.5" />
            <span>Tarefas</span>
            <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full text-[10px]">
              {tasks.filter((t) => !t.completed).length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("notes")}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === "notes"
                ? "border-indigo-600 text-indigo-600 font-extrabold bg-white"
                : "border-transparent hover:text-slate-900"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Notas</span>
            <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[10px]">
              {notesList.length}
            </span>
          </button>
        </div>

        {/* Tab Content Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700">
          {/* TAB 1: VISÃO GERAL */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Resumo Comercial Grid */}
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm mb-3 flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 text-indigo-600" />
                  <span>Resumo Comercial da Conta</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Contatos</span>
                    <span className="text-lg font-extrabold text-slate-900">{linkedContacts.length}</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Negócios Abertos</span>
                    <span className="text-lg font-extrabold text-purple-700">{openDeals.length}</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Pipeline Aberto</span>
                    <span className="text-lg font-extrabold text-emerald-700">
                      R$ {pipelineVal.toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Ganhos / Receita</span>
                    <span className="text-lg font-extrabold text-indigo-700">
                      R$ {wonVal.toLocaleString("pt-BR")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dados da Empresa */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
                <h4 className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-2 uppercase tracking-wider text-slate-500">
                  Dados Cadastrais
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium block">Razão Social:</span>
                    <span className="font-bold text-slate-800">{company.legalName || company.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">CNPJ:</span>
                    <span className="font-mono font-bold text-slate-800">{company.cnpj || "Não informado"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Site:</span>
                    {company.domain ? (
                      <a
                        href={`https://${company.domain}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-indigo-600 hover:underline inline-flex items-center gap-1"
                      >
                        {company.domain}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-slate-400">Sem site</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Telefone:</span>
                    <span className="font-bold text-slate-800">{company.phone || "Não informado"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">E-mail:</span>
                    <span className="font-bold text-slate-800">{company.email || "Não informado"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Porte / Funcionários:</span>
                    <span className="font-bold text-slate-800">
                      {company.size} {company.employeeCount ? `(${company.employeeCount} colab.)` : ""}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Faturamento Estimado:</span>
                    <span className="font-bold text-slate-800">{company.estimatedRevenue || "Não informado"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Origem:</span>
                    <span className="font-bold text-slate-800">{company.source || "Manual"}</span>
                  </div>
                </div>

                {company.address && (
                  <div className="pt-2 border-t border-slate-100 mt-2">
                    <span className="text-slate-400 font-medium block mb-1">Endereço Completo:</span>
                    <span className="font-bold text-slate-800 block">
                      {[
                        company.address.street,
                        company.address.number,
                        company.address.complement,
                        company.address.neighborhood,
                        company.address.city,
                        company.address.state,
                        company.address.zipCode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                )}
              </div>

              {/* Tags & Campos Personalizados */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
                  <h4 className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-2 mb-2 uppercase tracking-wider text-slate-500">
                    Tags da Conta
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {company.tags && company.tags.length > 0 ? (
                      company.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 rounded-lg font-bold text-xs text-indigo-700"
                        >
                          #{t}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400">Nenhuma tag atribuída</span>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
                  <h4 className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-2 mb-2 uppercase tracking-wider text-slate-500">
                    Campos Personalizados
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    {company.customFields && company.customFields.length > 0 ? (
                      company.customFields.map((cf, idx) => (
                        <div key={idx} className="flex justify-between font-medium">
                          <span className="text-slate-500">{cf.label}:</span>
                          <span className="font-bold text-slate-800">{cf.value}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-slate-400">Sem campos customizados</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTATOS VINCULADOS */}
          {activeTab === "contacts" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Contatos da Empresa</h3>
                  <p className="text-xs text-slate-500">Pessoas vinculadas nesta organização</p>
                </div>
                <button
                  onClick={() => onCreateContact(company)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Novo Contato</span>
                </button>
              </div>

              {linkedContacts.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                  <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-700">Nenhum contato vinculado ainda.</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Adicione contatos a esta empresa para gerenciar decisores e interlocutores.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {linkedContacts.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => onOpenContactDetail && onOpenContactDetail(contact)}
                      className="p-3.5 bg-white border border-slate-200 rounded-2xl hover:border-indigo-300 hover:shadow-xs transition-all flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        {contact.ownerAvatar ? (
                          <img
                            src={contact.ownerAvatar}
                            alt={contact.fullName}
                            className="h-9 w-9 rounded-full object-cover border border-slate-200"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-sm flex items-center justify-center">
                            {contact.fullName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <span className="font-extrabold text-slate-900 block text-sm">
                            {contact.fullName}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            {contact.jobTitle || "Sem cargo"} {contact.email && `• ${contact.email}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                          {contact.lifecycleStatus}
                        </span>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: NEGÓCIOS */}
          {activeTab === "deals" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Oportunidades & Negócios</h3>
                  <p className="text-xs text-slate-500">Funil comercial vinculado a esta conta</p>
                </div>
                <button
                  onClick={() => onCreateDeal(company)}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center gap-1"
                >
                  <Briefcase className="h-3.5 w-3.5" />
                  <span>Novo Negócio</span>
                </button>
              </div>

              {dealsList.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                  <Briefcase className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-700">Nenhum negócio criado nesta empresa.</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Crie oportunidades para projetar receitas e acompanhar o funil.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dealsList.map((deal) => (
                    <div
                      key={deal.id}
                      className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-purple-300 hover:shadow-xs transition-all flex items-center justify-between"
                    >
                      <div>
                        <span className="font-extrabold text-slate-900 block text-sm">
                          {deal.name}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 font-medium">
                          <span>Pipeline: {deal.pipelineName}</span>
                          <span>•</span>
                          <span className="font-bold text-purple-700">Etapa: {deal.stageName}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-extrabold text-emerald-700 block">
                          {deal.formattedValue || `R$ ${deal.value?.toLocaleString("pt-BR")}`}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Prev. Fechamento: {deal.expectedCloseDate}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ATIVIDADES (TIMELINE) */}
          {activeTab === "activities" && (
            <div className="space-y-5">
              {/* Registrar nova atividade */}
              <form onSubmit={handleAddActivity} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Registrar Nova Atividade
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      required
                      value={newActTitle}
                      onChange={(e) => setNewActTitle(e.target.value)}
                      placeholder="Título da atividade (Ex: Reunião de Alinhamento)"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <select
                      value={newActType}
                      onChange={(e) => setNewActType(e.target.value as CompanyActivity["type"])}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 text-xs"
                    >
                      <option value="call">Ligação</option>
                      <option value="meeting">Reunião</option>
                      <option value="email">E-mail</option>
                      <option value="note">Nota de Atividade</option>
                    </select>
                  </div>
                </div>

                <textarea
                  value={newActDesc}
                  onChange={(e) => setNewActDesc(e.target.value)}
                  rows={2}
                  placeholder="Detalhamento da interação..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1"
                  >
                    <Send className="h-3 w-3" />
                    <span>Salvar Atividade</span>
                  </button>
                </div>
              </form>

              {/* Timeline list */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                  Histórico e Linha do Tempo
                </h4>
                {activities.length === 0 ? (
                  <p className="text-slate-400 text-xs">Nenhuma atividade registrada.</p>
                ) : (
                  <div className="relative pl-4 border-l-2 border-indigo-100 space-y-4">
                    {activities.map((act) => (
                      <div key={act.id} className="relative group">
                        <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-indigo-600 border-2 border-white ring-2 ring-indigo-100" />
                        <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-extrabold text-slate-900 text-xs">
                              {act.title}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {act.createdAt}
                            </span>
                          </div>
                          <p className="text-slate-600 text-xs leading-relaxed">{act.description}</p>
                          <div className="mt-1 text-[10px] text-indigo-600 font-semibold">
                            Por: {act.authorName}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: TAREFAS */}
          {activeTab === "tasks" && (
            <div className="space-y-5">
              {/* Add Task Form */}
              <form onSubmit={handleAddTask} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Agendar Nova Tarefa
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      required
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Descrição da tarefa (Ex: Follow-up da proposta)"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={newTaskDueDate}
                      onChange={(e) => setNewTaskDueDate(e.target.value)}
                      placeholder="Prazo (Ex: Amanhã / 15/08)"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as "alta" | "media" | "baixa")}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-xl font-bold text-xs"
                  >
                    <option value="alta">Prioridade Alta</option>
                    <option value="media">Prioridade Média</option>
                    <option value="baixa">Prioridade Baixa</option>
                  </select>

                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Adicionar Tarefa</span>
                  </button>
                </div>
              </form>

              {/* Task list */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                  Lista de Tarefas da Empresa
                </h4>
                {tasks.length === 0 ? (
                  <p className="text-slate-400 text-xs">Nenhuma tarefa agendada.</p>
                ) : (
                  tasks.map((tsk) => (
                    <div
                      key={tsk.id}
                      className={`p-3 bg-white border rounded-2xl flex items-center justify-between gap-3 transition-colors ${
                        tsk.completed ? "border-slate-200 bg-slate-50 opacity-60" : "border-slate-200 hover:border-indigo-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={tsk.completed}
                          onChange={() => handleToggleTask(tsk.id)}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                        />
                        <span
                          className={`font-bold text-xs ${
                            tsk.completed ? "line-through text-slate-500" : "text-slate-900"
                          }`}
                        >
                          {tsk.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-600">
                          {tsk.dueDate}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 6: NOTAS INTERNAS */}
          {activeTab === "notes" && (
            <div className="space-y-5">
              {/* Add note */}
              <form onSubmit={handleAddNote} className="space-y-2">
                <textarea
                  rows={3}
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Escreva uma observação interna sobre esta empresa..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:bg-white focus:border-indigo-600"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!newNoteText.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-sm"
                  >
                    Adicionar Nota
                  </button>
                </div>
              </form>

              {/* Notes feed */}
              <div className="space-y-3">
                {notesList.length === 0 ? (
                  <p className="text-slate-400 text-xs">Nenhuma nota cadastrada.</p>
                ) : (
                  notesList.map((note) => (
                    <div key={note.id} className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-2xl text-amber-950">
                      <p className="text-xs font-medium leading-relaxed mb-2">{note.content}</p>
                      <div className="flex items-center justify-between text-[10px] text-amber-800 font-bold border-t border-amber-200/60 pt-1.5">
                        <span>Por: {note.authorName}</span>
                        <span>{note.createdAt}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
