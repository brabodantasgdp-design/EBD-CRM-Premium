import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Clock,
  User,
  MapPin,
  Video,
  FileText,
  AlertCircle,
  PhoneCall,
  Users,
  Mail,
  RefreshCw,
  Link as LinkIcon,
} from "lucide-react";
import { ActivityItem } from "../../types/crm";
import { useCRM } from "../../context/CRMContext";
import { getLocalDateString } from "../../utils/formatters";
import { MOCK_TASK_OWNERS } from "../tasks/TaskFormModal";
import { hasSupabaseConfiguration } from "../../lib/supabase/env";

interface ActivityFormModalProps {
  isOpen: boolean;
  activityToEdit?: ActivityItem | null;
  initialDate?: string; // YYYY-MM-DD
  initialTime?: string; // HH:mm
  initialEntity?: {
    entityType: "lead" | "contact" | "company" | "deal";
    entityId: string;
    entityName: string;
  };
  onClose: () => void;
  onSave: (activityData: Partial<ActivityItem>) => void;
}

export const ActivityFormModal: React.FC<ActivityFormModalProps> = ({
  isOpen,
  activityToEdit,
  initialDate,
  initialTime,
  initialEntity,
  onClose,
  onSave,
}) => {
  const { contacts, companies, deals, members } = useCRM();
  const ownerOptions = hasSupabaseConfiguration() ? members : MOCK_TASK_OWNERS;

  const [type, setType] = useState<"call" | "meeting" | "email" | "follow_up" | "note">("meeting");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ownerId, setOwnerId] = useState("usr-1");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [entityType, setEntityType] = useState<"none" | "lead" | "contact" | "company" | "deal">("none");
  const [entityId, setEntityId] = useState("");
  const [entityName, setEntityName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const mockLeadsOptions = [
    { id: "lead-1", name: "Carlos Silva (Silva Consultoria)" },
    { id: "lead-2", name: "Fernanda Lima (Inova Tech)" },
    { id: "lead-3", name: "Marcos Oliveira (Logística Brasil)" },
  ];

  useEffect(() => {
    if (activityToEdit) {
      setType(activityToEdit.type || "meeting");
      setTitle(activityToEdit.title || "");
      setDescription(activityToEdit.description || "");
      setOwnerId(activityToEdit.ownerId || "usr-1");
      
      const isoStart = activityToEdit.startAt || "";
      if (isoStart.includes("T")) {
        const [dPart, tPart] = isoStart.split("T");
        setDate(dPart);
        setStartTime(tPart.substring(0, 5));
      } else {
        setDate(isoStart);
        setStartTime("10:00");
      }

      if (activityToEdit.endAt && activityToEdit.endAt.includes("T")) {
        setEndTime(activityToEdit.endAt.split("T")[1].substring(0, 5));
      } else {
        setEndTime("11:00");
      }

      setAllDay(activityToEdit.allDay || false);
      setLocation(activityToEdit.location || "");
      setMeetingLink(activityToEdit.meetingLink || "");
      setEntityType(activityToEdit.entityType || "none");
      setEntityId(activityToEdit.entityId || "");
      setEntityName(activityToEdit.entityName || "");
    } else {
      const defaultDate = initialDate || getLocalDateString();
      const defaultStartTime = initialTime || "10:00";
      
      setType("meeting");
      setTitle("");
      setDescription("");
      setOwnerId("usr-1");
      setDate(defaultDate);
      setStartTime(defaultStartTime);
      setEndTime("11:00");
      setAllDay(false);
      setLocation("");
      setMeetingLink("");

      if (initialEntity) {
        setEntityType(initialEntity.entityType);
        setEntityId(initialEntity.entityId);
        setEntityName(initialEntity.entityName);
      } else {
        setEntityType("none");
        setEntityId("");
        setEntityName("");
      }
    }
    setErrorMsg("");
  }, [activityToEdit, initialDate, initialTime, initialEntity, isOpen]);

  useEffect(() => {
    if (ownerOptions.length && !ownerOptions.some((owner) => owner.id === ownerId)) {
      setOwnerId(activityToEdit?.ownerId || ownerOptions[0].id);
    }
  }, [activityToEdit?.ownerId, ownerId, ownerOptions]);

  if (!isOpen) return null;

  const handleEntitySelection = (id: string) => {
    setEntityId(id);
    if (entityType === "contact") {
      const cnt = contacts.find((c) => c.id === id);
      setEntityName(cnt ? cnt.fullName : "");
    } else if (entityType === "company") {
      const comp = companies.find((c) => c.id === id);
      setEntityName(comp ? comp.name : "");
    } else if (entityType === "deal") {
      const dl = deals.find((d) => d.id === id);
      setEntityName(dl ? dl.name : "");
    } else if (entityType === "lead") {
      const ld = mockLeadsOptions.find((l) => l.id === id);
      setEntityName(ld ? ld.name : "");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("O título do compromisso é obrigatório.");
      return;
    }
    if (!date) {
      setErrorMsg("A data do compromisso é obrigatória.");
      return;
    }

    const ownerObj = ownerOptions.find((o) => o.id === ownerId);
    const startAtIso = allDay ? `${date}T00:00:00` : `${date}T${startTime}:00`;
    const endAtIso = allDay ? `${date}T23:59:59` : `${date}T${endTime}:00`;

    const activityPayload: Partial<ActivityItem> = {
      type,
      title: title.trim(),
      description: description.trim(),
      ownerId,
      ownerName: ownerObj?.name || "Sem responsável",
      startAt: startAtIso,
      endAt: endAtIso,
      allDay,
      location: location.trim(),
      meetingLink: meetingLink.trim(),
      entityType: entityType !== "none" ? entityType : undefined,
      entityId: entityType !== "none" ? entityId : undefined,
      entityName: entityType !== "none" ? entityName : undefined,
      status: activityToEdit ? activityToEdit.status : "scheduled",
    };

    onSave(activityPayload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {activityToEdit ? "Editar Compromisso" : "Novo Compromisso de Agenda"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Agende reuniões, chamadas e follow-ups comerciais
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Type Selector Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tipo de Atividade
            </label>
            <div className="grid grid-cols-5 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setType("meeting")}
                className={`py-2 px-1 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  type === "meeting"
                    ? "bg-white dark:bg-slate-900 text-purple-600 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                <span className="text-[10px]">Reunião</span>
              </button>
              <button
                type="button"
                onClick={() => setType("call")}
                className={`py-2 px-1 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  type === "call"
                    ? "bg-white dark:bg-slate-900 text-emerald-600 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <PhoneCall className="h-3.5 w-3.5" />
                <span className="text-[10px]">Ligação</span>
              </button>
              <button
                type="button"
                onClick={() => setType("follow_up")}
                className={`py-2 px-1 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  type === "follow_up"
                    ? "bg-white dark:bg-slate-900 text-amber-600 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span className="text-[10px]">Follow-up</span>
              </button>
              <button
                type="button"
                onClick={() => setType("email")}
                className={`py-2 px-1 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  type === "email"
                    ? "bg-white dark:bg-slate-900 text-blue-600 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Mail className="h-3.5 w-3.5" />
                <span className="text-[10px]">E-mail</span>
              </button>
              <button
                type="button"
                onClick={() => setType("note")}
                className={`py-2 px-1 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  type === "note"
                    ? "bg-white dark:bg-slate-900 text-slate-700 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span className="text-[10px]">Nota</span>
              </button>
            </div>
          </div>

          {/* Título */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Título do Compromisso <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Reunião de apresentação técnica com Diretor de TI..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Date and Time Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hora Inicial
              </label>
              <input
                type="time"
                disabled={allDay}
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hora Final
              </label>
              <input
                type="time"
                disabled={allDay}
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allDayCheck"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
            />
            <label htmlFor="allDayCheck" className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Dia inteiro
            </label>
          </div>

          {/* Responsável & Local */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Responsável
              </label>
              <select
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {ownerOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Local / Plataforma
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ex: Google Meet, Sala 02, Presencial..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Meeting Link */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Link da Reunião
            </label>
            <div className="relative">
              <Video className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="url"
                placeholder="Ex: https://meet.google.com/abc-defg-hij"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Relacionado a (Entidade) */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-indigo-500" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Vincular a um Registro do CRM
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Tipo de Entidade
                </label>
                <select
                  value={entityType}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setEntityType(val);
                    setEntityId("");
                    setEntityName("");
                  }}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="none">Nenhum vínculo</option>
                  <option value="lead">Lead</option>
                  <option value="contact">Contato</option>
                  <option value="company">Empresa</option>
                  <option value="deal">Negócio</option>
                </select>
              </div>

              {entityType !== "none" && (
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Selecionar Registro
                  </label>
                  <select
                    value={entityId}
                    onChange={(e) => handleEntitySelection(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Selecione...</option>
                    {entityType === "lead" &&
                      mockLeadsOptions.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}

                    {entityType === "contact" &&
                      contacts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.fullName} ({c.companyName || "Sem empresa"})
                        </option>
                      ))}

                    {entityType === "company" &&
                      companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}

                    {entityType === "deal" &&
                      deals.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.formattedValue})
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Descrição / Pauta */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Pauta / Observações
            </label>
            <textarea
              rows={3}
              placeholder="Anotações prévias ou ata da reunião..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-colors active:scale-95"
            >
              {activityToEdit ? "Salvar Alterações" : "Agendar Compromisso"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
