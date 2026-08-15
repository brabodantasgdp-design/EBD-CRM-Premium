import React, { useState } from "react";
import {
  UserCheck,
  Tag,
  CheckSquare,
  Download,
  Archive,
  X,
  ChevronDown,
  Layers,
} from "lucide-react";
import { LeadStatus } from "../../types/crm";
import { MOCK_OWNERS, MOCK_TAGS } from "../../data/mockLeadsData";
import { useCRM } from "../../context/CRMContext";
import { hasSupabaseConfiguration } from "../../lib/supabase/env";

interface LeadBulkActionsProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkUpdateOwner: (ownerId: string) => void;
  onBulkUpdateStatus: (status: LeadStatus) => void;
  onBulkAddTag: (tag: string) => void;
  onBulkRemoveTag: (tag: string) => void;
  onBulkCreateTask: () => void;
  onBulkExport: () => void;
  onBulkArchive: () => void;
}

export const LeadBulkActions: React.FC<LeadBulkActionsProps> = ({
  selectedCount,
  onClearSelection,
  onBulkUpdateOwner,
  onBulkUpdateStatus,
  onBulkAddTag,
  onBulkRemoveTag,
  onBulkCreateTask,
  onBulkExport,
  onBulkArchive,
}) => {
  const { members, leads } = useCRM();
  const ownerOptions = hasSupabaseConfiguration() ? members : MOCK_OWNERS;
  const tagOptions = hasSupabaseConfiguration() ? Array.from(new Set(leads.flatMap((lead) => lead.tags ?? []))) : MOCK_TAGS;
  const [activeMenu, setActiveMenu] = useState<
    "owner" | "status" | "tag" | "remove_tag" | null
  >(null);

  if (selectedCount === 0) return null;

  return (
    <div data-testid="lead-bulk-actions" className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-2xl w-[92%] sm:w-auto">
      <div className="bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800 p-2 sm:p-2.5 flex items-center justify-between gap-2 sm:gap-3 backdrop-blur-md">
        {/* Count Indicator */}
        <div className="flex items-center gap-2 pl-2 border-r border-slate-800 pr-3 shrink-0">
          <span className="h-6 w-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
            {selectedCount}
          </span>
          <span className="text-xs font-medium text-slate-200 hidden sm:inline">
            selecionado{selectedCount > 1 ? "s" : ""}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto custom-scrollbar py-0.5">
          {/* Alterar Responsável */}
          <div className="relative">
            <button
              data-testid="bulk-owner-trigger"
              onClick={() =>
                setActiveMenu(activeMenu === "owner" ? null : "owner")
              }
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors shrink-0"
            >
              <UserCheck className="h-3.5 w-3.5 text-indigo-400" />
              <span className="hidden md:inline">Responsável</span>
              <ChevronDown className="h-3 w-3" />
            </button>

            {activeMenu === "owner" && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setActiveMenu(null)}
                />
                <div className="fixed left-1/2 -translate-x-1/2 bottom-20 lg:bottom-16 mb-2 w-48 bg-slate-800 rounded-xl shadow-xl border border-slate-700 py-1 z-[60] text-xs">
                  <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700">
                    Atribuir Responsável
                  </div>
                  {ownerOptions.map((owner) => (
                    <button
                      key={owner.id}
                      onClick={() => {
                        onBulkUpdateOwner(owner.id);
                        setActiveMenu(null);
                      }}
                      className="w-full text-left px-3 py-1.5 text-slate-200 hover:bg-slate-700 flex items-center gap-2"
                    >
                      <img
                        src={owner.avatar}
                        alt={owner.name}
                        className="h-4 w-4 rounded-full"
                      />
                      <span>{owner.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Alterar Status */}
          <div className="relative">
            <button
              data-testid="bulk-status-trigger"
              onClick={() =>
                setActiveMenu(activeMenu === "status" ? null : "status")
              }
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors shrink-0"
            >
              <Layers className="h-3.5 w-3.5 text-indigo-400" />
              <span className="hidden md:inline">Status</span>
              <ChevronDown className="h-3 w-3" />
            </button>

            {activeMenu === "status" && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setActiveMenu(null)}
                />
                <div className="fixed left-1/2 -translate-x-1/2 bottom-20 lg:bottom-16 mb-2 w-44 bg-slate-800 rounded-xl shadow-xl border border-slate-700 py-1 z-[60] text-xs">
                  <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700">
                    Alterar Status
                  </div>
                  {[
                    { label: "Novo", value: "new" },
                    { label: "Em contato", value: "contacted" },
                    { label: "Qualificado", value: "qualified" },
                    { label: "Nutrição", value: "nurturing" },
                    { label: "Desqualificado", value: "disqualified" },
                  ].map((s) => (
                    <button
                      key={s.value}
                      onClick={() => {
                        onBulkUpdateStatus(s.value as LeadStatus);
                        setActiveMenu(null);
                      }}
                      className="w-full text-left px-3 py-1.5 text-slate-200 hover:bg-slate-700"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Adicionar Tag */}
          <div className="relative">
            <button
              data-testid="bulk-tags-trigger"
              onClick={() =>
                setActiveMenu(activeMenu === "tag" ? null : "tag")
              }
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors shrink-0"
            >
              <Tag className="h-3.5 w-3.5 text-indigo-400" />
              <span className="hidden md:inline">Tag</span>
              <ChevronDown className="h-3 w-3" />
            </button>

            {activeMenu === "tag" && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setActiveMenu(null)}
                />
                <div className="fixed left-1/2 -translate-x-1/2 bottom-20 lg:bottom-16 mb-2 w-44 bg-slate-800 rounded-xl shadow-xl border border-slate-700 py-1 z-[60] text-xs">
                  <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700">
                    Adicionar Tag
                  </div>
                  {tagOptions.map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        onBulkAddTag(t);
                        setActiveMenu(null);
                      }}
                      className="w-full text-left px-3 py-1.5 text-slate-200 hover:bg-slate-700"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Remover Tag */}
          <div className="relative">
            <button
              data-testid="bulk-remove-tags-trigger"
              onClick={() =>
                setActiveMenu(activeMenu === "remove_tag" ? null : "remove_tag")
              }
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors shrink-0"
            >
              <Tag className="h-3.5 w-3.5 text-indigo-400" />
              <span className="hidden md:inline">Remover tag</span>
              <ChevronDown className="h-3 w-3" />
            </button>

            {activeMenu === "remove_tag" && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setActiveMenu(null)} />
                <div className="fixed left-1/2 -translate-x-1/2 bottom-20 lg:bottom-16 mb-2 w-44 bg-slate-800 rounded-xl shadow-xl border border-slate-700 py-1 z-[60] text-xs">
                  <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700">
                    Remover Tag
                  </div>
                  {tagOptions.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        onBulkRemoveTag(tag);
                        setActiveMenu(null);
                      }}
                      className="w-full text-left px-3 py-1.5 text-slate-200 hover:bg-slate-700"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Criar Tarefa */}
          <button
            onClick={onBulkCreateTask}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors shrink-0"
          >
            <CheckSquare className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Criar Tarefa</span>
          </button>

          {/* Exportar Selecionados */}
          <button
            onClick={onBulkExport}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors shrink-0"
          >
            <Download className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Exportar</span>
          </button>

          {/* Arquivar */}
          <button
            data-testid="bulk-archive-trigger"
            onClick={onBulkArchive}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-rose-900/60 hover:bg-rose-900 text-rose-200 transition-colors shrink-0"
            title="Arquivar leads selecionados"
          >
            <Archive className="h-3.5 w-3.5 text-rose-400" />
            <span className="hidden sm:inline">Arquivar</span>
          </button>
        </div>

        {/* Clear Selection */}
        <button
          onClick={onClearSelection}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
          title="Desmarcar seleção"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
