import React, { useState } from "react";
import { ContactItem } from "../../types/crm";
import { ContactStatusBadge } from "./ContactStatusBadge";
import { useCRM } from "../../context/CRMContext";
import {
  MoreVertical,
  Building2,
  Mail,
  Phone,
  Briefcase,
  CheckSquare,
  Eye,
  Edit,
  PlusCircle,
  Archive,
  Clock,
} from "lucide-react";

interface ContactCardProps {
  contact: ContactItem;
  isSelected: boolean;
  onSelectToggle: (id: string) => void;
  onViewContact: (contact: ContactItem) => void;
  onEditContact: (contact: ContactItem) => void;
  onArchiveContact: (contact: ContactItem) => void;
  onQuickTask: (contact: ContactItem) => void;
  onQuickActivity: (contact: ContactItem) => void;
  onOpenCompanyQuickView: (companyName: string, companyData?: ContactItem["companyData"]) => void;
}

export const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  isSelected,
  onSelectToggle,
  onViewContact,
  onEditContact,
  onArchiveContact,
  onQuickTask,
  onQuickActivity,
  onOpenCompanyQuickView,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { getEntityTasks } = useCRM();

  const openDealsCount = contact.deals?.filter((d) => d.status === "open").length ?? 0;
  const pendingTask = getEntityTasks("contact", contact.id).find((t) => t.status === "pending");

  return (
    <div
      className={`bg-white rounded-2xl p-4 border transition-all shadow-2xs space-y-3 relative ${
        isSelected ? "border-indigo-500 bg-indigo-50/30 ring-1 ring-indigo-500" : "border-slate-200"
      }`}
    >
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelectToggle(contact.id)}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer mt-0.5"
          />
          <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 border border-indigo-200 text-xs">
            {contact.firstName.charAt(0)}
            {contact.lastName ? contact.lastName.charAt(0) : ""}
          </div>
          <div>
            <button
              onClick={() => onViewContact(contact)}
              className="font-bold text-slate-900 text-sm hover:text-indigo-600 text-left block"
            >
              {contact.fullName}
            </button>
            <p className="text-xs text-slate-500 font-medium line-clamp-1">
              {contact.jobTitle || "Sem cargo registrado"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <ContactStatusBadge status={contact.lifecycleStatus} archived={!!contact.archivedAt} />
          
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Contextual Action Menu Dropdown */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-3 top-12 z-20 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 text-left text-xs space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => {
                setMenuOpen(false);
                onViewContact(contact);
              }}
              className="w-full px-3 py-2 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 font-semibold"
            >
              <Eye className="h-4 w-4" />
              <span>Ver Detalhes 360°</span>
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                onEditContact(contact);
              }}
              className="w-full px-3 py-2 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 font-semibold"
            >
              <Edit className="h-4 w-4" />
              <span>Editar Contato</span>
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                onQuickTask(contact);
              }}
              className="w-full px-3 py-2 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 font-semibold"
            >
              <CheckSquare className="h-4 w-4" />
              <span>Criar Tarefa</span>
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                onQuickActivity(contact);
              }}
              className="w-full px-3 py-2 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 font-semibold"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Registrar Atividade</span>
            </button>
            <div className="my-1 border-t border-slate-100" />
            <button
              onClick={() => {
                setMenuOpen(false);
                onArchiveContact(contact);
              }}
              className="w-full px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-semibold"
            >
              <Archive className="h-4 w-4" />
              <span>Arquivar</span>
            </button>
          </div>
        </>
      )}

      {/* Company Info Badge */}
      {contact.companyName && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => onOpenCompanyQuickView(contact.companyName!, contact.companyData)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 font-semibold text-xs border border-slate-200/80 hover:bg-indigo-50 hover:text-indigo-700 transition-all"
          >
            <Building2 className="h-3.5 w-3.5 text-slate-500" />
            <span>{contact.companyName}</span>
          </button>
        </div>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100 text-slate-600">
        <div>
          <span className="text-[10px] text-slate-400 font-medium block">E-mail:</span>
          <span className="font-semibold text-slate-800 truncate block">
            {contact.email || "—"}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 font-medium block">Telefone:</span>
          <span className="font-semibold text-slate-800 truncate block">
            {contact.mobilePhone || contact.phone || "—"}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 font-medium block">Responsável:</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <img
              src={contact.ownerAvatar}
              alt={contact.ownerName}
              className="h-4 w-4 rounded-full object-cover"
            />
            <span className="font-semibold text-slate-800 text-xs">{contact.ownerName}</span>
          </div>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 font-medium block">Negócios Abertos:</span>
          <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80 inline-block mt-0.5">
            {openDealsCount} Oportunidade(s)
          </span>
        </div>
      </div>

      {/* Task & Activity Footer */}
      <div className="pt-2 border-t border-slate-100 text-[11px] space-y-1">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Clock className="h-3 w-3 text-slate-400 shrink-0" />
          <span className="truncate">{contact.lastActivityText || "Sem histórico recente"}</span>
        </div>

        {pendingTask && (
          <div className="flex items-center gap-1.5 text-indigo-700 font-semibold bg-indigo-50/80 p-1.5 rounded-lg border border-indigo-100">
            <CheckSquare className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
            <span className="truncate">Próxima: {pendingTask.title}</span>
          </div>
        )}
      </div>
    </div>
  );
};
