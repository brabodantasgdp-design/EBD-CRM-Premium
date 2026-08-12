import React, { useState } from "react";
import {
  X,
  UserCheck,
  Tag,
  CheckSquare,
  Download,
  Archive,
  ChevronDown,
  Users,
} from "lucide-react";
import { ContactLifecycleStatus } from "../../types/crm";

interface ContactBulkActionsProps {
  selectedCount: number;
  onClearSelection: () => void;
  onChangeOwner: (newOwnerId: string, ownerName: string) => void;
  onChangeStatus: (newStatus: ContactLifecycleStatus) => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onCreateTask: () => void;
  onExportSelected: () => void;
  onArchiveSelected: () => void;
  availableOwners: { id: string; name: string }[];
  availableTags: string[];
}

export const ContactBulkActions: React.FC<ContactBulkActionsProps> = ({
  selectedCount,
  onClearSelection,
  onChangeOwner,
  onChangeStatus,
  onAddTag,
  onRemoveTag,
  onCreateTask,
  onExportSelected,
  onArchiveSelected,
  availableOwners,
  availableTags,
}) => {
  const [activeDropdown, setActiveDropdown] = useState<
    "owner" | "status" | "add_tag" | "remove_tag" | null
  >(null);

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-16 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-2xl bg-slate-900 text-white p-3 rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-md animate-in slide-in-from-bottom-5 duration-200">
      <div className="flex items-center justify-between gap-2">
        {/* Count Badge */}
        <div className="flex items-center gap-2 shrink-0 pr-2 border-r border-slate-700">
          <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-xs font-bold">
            {selectedCount}
          </span>
          <span className="text-xs font-medium text-slate-300 hidden sm:inline">
            contato(s) selecionado(s)
          </span>
          <button
            onClick={onClearSelection}
            className="p-1 text-slate-400 hover:text-white rounded-full transition-colors"
            title="Limpar seleção"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs scrollbar-none py-1">
          {/* Change Owner */}
          <div className="relative">
            <button
              onClick={() =>
                setActiveDropdown(activeDropdown === "owner" ? null : "owner")
              }
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Users className="h-3.5 w-3.5 text-indigo-400" />
              <span>Responsável</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {activeDropdown === "owner" && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setActiveDropdown(null)}
                />
                <div className="absolute bottom-full mb-2 left-0 z-20 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1 text-xs">
                  {availableOwners.map((owner) => (
                    <button
                      key={owner.id}
                      onClick={() => {
                        setActiveDropdown(null);
                        onChangeOwner(owner.id, owner.name);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-700 text-slate-200 font-medium"
                    >
                      {owner.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Change Status */}
          <div className="relative">
            <button
              onClick={() =>
                setActiveDropdown(activeDropdown === "status" ? null : "status")
              }
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Status</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {activeDropdown === "status" && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setActiveDropdown(null)}
                />
                <div className="absolute bottom-full mb-2 left-0 z-20 w-40 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1 text-xs">
                  <button
                    onClick={() => {
                      setActiveDropdown(null);
                      onChangeStatus("active");
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-700 text-emerald-400 font-bold"
                  >
                    Ativo
                  </button>
                  <button
                    onClick={() => {
                      setActiveDropdown(null);
                      onChangeStatus("customer");
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-700 text-indigo-400 font-bold"
                  >
                    Cliente
                  </button>
                  <button
                    onClick={() => {
                      setActiveDropdown(null);
                      onChangeStatus("inactive");
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-700 text-slate-300 font-bold"
                  >
                    Inativo
                  </button>
                  <button
                    onClick={() => {
                      setActiveDropdown(null);
                      onChangeStatus("former_customer");
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-700 text-amber-400 font-bold"
                  >
                    Ex-cliente
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Add Tag */}
          <div className="relative">
            <button
              onClick={() =>
                setActiveDropdown(activeDropdown === "add_tag" ? null : "add_tag")
              }
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Tag className="h-3.5 w-3.5 text-amber-400" />
              <span>+ Tag</span>
            </button>

            {activeDropdown === "add_tag" && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setActiveDropdown(null)}
                />
                <div className="absolute bottom-full mb-2 left-0 z-20 w-44 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1 text-xs">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        setActiveDropdown(null);
                        onAddTag(tag);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-700 text-slate-200 font-medium"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Create Task */}
          <button
            onClick={onCreateTask}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <CheckSquare className="h-3.5 w-3.5 text-blue-400" />
            <span>Tarefa</span>
          </button>

          {/* Export Selected */}
          <button
            onClick={onExportSelected}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5 text-slate-400" />
            <span>CSV</span>
          </button>

          {/* Archive Selected */}
          <button
            onClick={onArchiveSelected}
            className="px-2.5 py-1.5 rounded-xl bg-rose-900/60 hover:bg-rose-900 text-rose-200 font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Archive className="h-3.5 w-3.5" />
            <span>Arquivar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
