import React, { useState } from "react";
import { ContactItem } from "../../types/crm";
import { ContactStatusBadge } from "./ContactStatusBadge";
import { useCRM } from "../../context/CRMContext";
import {
  MoreVertical,
  Building2,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  CheckSquare,
  Clock,
  Edit,
  Eye,
  Archive,
  PlusCircle,
} from "lucide-react";

interface ContactTableProps {
  contacts: ContactItem[];
  selectedIds: string[];
  onSelectToggle: (id: string) => void;
  onSelectAllToggle: () => void;
  onViewContact: (contact: ContactItem) => void;
  onEditContact: (contact: ContactItem) => void;
  onArchiveContact: (contact: ContactItem) => void;
  onQuickTask: (contact: ContactItem) => void;
  onQuickActivity: (contact: ContactItem) => void;
  onOpenCompanyQuickView: (companyName: string, companyData?: ContactItem["companyData"]) => void;
}

export const ContactTable: React.FC<ContactTableProps> = ({
  contacts,
  selectedIds,
  onSelectToggle,
  onSelectAllToggle,
  onViewContact,
  onEditContact,
  onArchiveContact,
  onQuickTask,
  onQuickActivity,
  onOpenCompanyQuickView,
}) => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const { getEntityTasks } = useCRM();

  const allSelected =
    contacts.length > 0 && contacts.every((c) => selectedIds.includes(c.id));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto min-w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="p-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onSelectAllToggle}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                />
              </th>
              <th className="p-3 min-w-[200px]">Contato</th>
              <th className="p-3 min-w-[150px]">Empresa</th>
              <th className="p-3 min-w-[140px]">Cargo</th>
              <th className="p-3 min-w-[110px]">Status</th>
              <th className="p-3 min-w-[140px]">Responsável</th>
              <th className="p-3 min-w-[120px] text-center">Negócios Abertos</th>
              <th className="p-3 min-w-[180px]">Última Atividade</th>
              <th className="p-3 min-w-[160px]">Próxima Tarefa</th>
              <th className="p-3 min-w-[100px]">Criado em</th>
              <th className="p-3 w-12 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
            {contacts.map((contact) => {
              const isSelected = selectedIds.includes(contact.id);
              const openDealsCount = contact.deals?.filter((d) => d.status === "open").length ?? 0;
              const pendingTask = getEntityTasks("contact", contact.id).find((t) => t.status === "pending");

              return (
                <tr
                  key={contact.id}
                  className={`hover:bg-indigo-50/30 transition-colors ${
                    isSelected ? "bg-indigo-50/50" : ""
                  }`}
                >
                  {/* Selection */}
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onSelectToggle(contact.id)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                    />
                  </td>

                  {/* Contato (Name + Email + Phone) */}
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 border border-indigo-200/80 text-xs shadow-2xs">
                        {contact.firstName.charAt(0)}
                        {contact.lastName ? contact.lastName.charAt(0) : ""}
                      </div>
                      <div className="min-w-0">
                        <button
                          onClick={() => onViewContact(contact)}
                          className="font-bold text-slate-900 hover:text-indigo-600 text-xs truncate block text-left transition-colors"
                        >
                          {contact.fullName}
                        </button>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 truncate">
                          {contact.email && (
                            <span className="flex items-center gap-1 truncate" title={contact.email}>
                              <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                              <span className="truncate">{contact.email}</span>
                            </span>
                          )}
                          {contact.phone && (
                            <span className="hidden xl:flex items-center gap-1 shrink-0" title={contact.phone}>
                              <Phone className="h-3 w-3 text-slate-400" />
                              <span>{contact.phone}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Empresa (Clickable Contextual View) */}
                  <td className="p-3">
                    {contact.companyName ? (
                      <button
                        type="button"
                        onClick={() =>
                          onOpenCompanyQuickView(contact.companyName!, contact.companyData)
                        }
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100/80 text-slate-800 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200/60 font-semibold transition-all text-xs"
                      >
                        <Building2 className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        <span className="truncate max-w-[120px]">{contact.companyName}</span>
                      </button>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">Sem empresa</span>
                    )}
                  </td>

                  {/* Cargo */}
                  <td className="p-3">
                    <span className="text-slate-700 truncate block max-w-[130px]">
                      {contact.jobTitle || "—"}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="p-3">
                    <ContactStatusBadge
                      status={contact.lifecycleStatus}
                      archived={!!contact.archivedAt}
                    />
                  </td>

                  {/* Responsável */}
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={contact.ownerAvatar}
                        alt={contact.ownerName}
                        className="h-6 w-6 rounded-full object-cover shrink-0 border border-slate-200"
                      />
                      <span className="truncate text-slate-800">{contact.ownerName}</span>
                    </div>
                  </td>

                  {/* Negócios Abertos */}
                  <td className="p-3 text-center">
                    {openDealsCount > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <Briefcase className="h-3 w-3 text-amber-600" />
                        <span>{openDealsCount}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Nenhum</span>
                    )}
                  </td>

                  {/* Última Atividade */}
                  <td className="p-3">
                    <span className="text-slate-600 line-clamp-1 text-[11px]" title={contact.lastActivityText}>
                      {contact.lastActivityText || "Sem registros"}
                    </span>
                  </td>

                  {/* Próxima Tarefa */}
                  <td className="p-3">
                    {pendingTask ? (
                      <div className="flex items-center gap-1.5 text-indigo-700 font-semibold text-[11px]" title={pendingTask.title}>
                        <CheckSquare className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                        <span className="truncate max-w-[140px]">{pendingTask.title}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Nenhuma</span>
                    )}
                  </td>

                  {/* Criado Em */}
                  <td className="p-3 text-slate-500 text-[11px]">
                    {contact.createdAt}
                  </td>

                  {/* Ações */}
                  <td className="p-3 text-center relative">
                    <button
                      onClick={() =>
                        setActiveMenuId(activeMenuId === contact.id ? null : contact.id)
                      }
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {activeMenuId === contact.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setActiveMenuId(null)}
                        />
                        <div className="absolute right-3 top-10 z-20 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 text-left text-xs space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              onViewContact(contact);
                            }}
                            className="w-full px-3 py-1.5 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 font-semibold"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Ver Detalhes</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              onEditContact(contact);
                            }}
                            className="w-full px-3 py-1.5 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 font-semibold"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            <span>Editar Contato</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              onQuickTask(contact);
                            }}
                            className="w-full px-3 py-1.5 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 font-semibold"
                          >
                            <CheckSquare className="h-3.5 w-3.5" />
                            <span>Criar Tarefa</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              onQuickActivity(contact);
                            }}
                            className="w-full px-3 py-1.5 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 font-semibold"
                          >
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span>Registrar Atividade</span>
                          </button>

                          <div className="my-1 border-t border-slate-100" />

                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              onArchiveContact(contact);
                            }}
                            className="w-full px-3 py-1.5 text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-semibold"
                          >
                            <Archive className="h-3.5 w-3.5" />
                            <span>Arquivar</span>
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
