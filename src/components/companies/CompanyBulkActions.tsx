import React, { useState } from "react";
import {
  Users,
  UserCheck,
  Tag,
  CheckSquare,
  Download,
  Archive,
  X,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import { CompanyStatus } from "../../types/crm";
import { COMPANY_STATUS_CONFIG, COMPANY_TAGS } from "../../constants/companyStatus";
import { MOCK_OWNERS } from "../../data/mockContactsData";

interface CompanyBulkActionsProps {
  selectedCount: number;
  onClearSelection: () => void;
  onChangeOwner: (newOwnerId: string, newOwnerName: string) => void;
  onChangeStatus: (newStatus: CompanyStatus) => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onCreateBulkTask: (taskTitle: string) => void;
  onExportSelected: () => void;
  onArchiveSelected: () => void;
}

export const CompanyBulkActions: React.FC<CompanyBulkActionsProps> = ({
  selectedCount,
  onClearSelection,
  onChangeOwner,
  onChangeStatus,
  onAddTag,
  onRemoveTag,
  onCreateBulkTask,
  onExportSelected,
  onArchiveSelected,
}) => {
  const [activeDropdown, setActiveDropdown] = useState<
    "owner" | "status" | "addTag" | "removeTag" | "task" | null
  >(null);
  const [taskInput, setTaskInput] = useState("");
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <>
      {/* Floating Bottom Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-4xl bg-slate-900 text-white rounded-2xl p-3 sm:p-4 shadow-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-bottom duration-200">
        {/* Count Indicator */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="h-7 px-2.5 rounded-lg bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
            {selectedCount}
          </span>
          <span className="text-xs font-bold text-slate-200">
            {selectedCount === 1 ? "empresa selecionada" : "empresas selecionadas"}
          </span>
          <button
            onClick={onClearSelection}
            className="text-slate-400 hover:text-white p-1 rounded-md text-xs underline font-medium"
          >
            Desmarcar
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Alterar Responsável */}
          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === "owner" ? null : "owner")}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <UserCheck className="h-3.5 w-3.5 text-indigo-400" />
              <span>Responsável</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {activeDropdown === "owner" && (
              <div className="absolute bottom-full mb-2 left-0 w-48 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 p-1.5 z-50 text-xs font-semibold animate-in fade-in duration-100">
                <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-100 mb-1">
                  Atribuir a:
                </div>
                {MOCK_OWNERS.map((owner) => (
                  <button
                    key={owner.id}
                    onClick={() => {
                      onChangeOwner(owner.id, owner.name);
                      setActiveDropdown(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-slate-100 rounded-lg flex items-center gap-2"
                  >
                    <img
                      src={owner.avatar}
                      alt={owner.name}
                      className="h-4 w-4 rounded-full object-cover"
                    />
                    <span>{owner.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Alterar Status */}
          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === "status" ? null : "status")}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Users className="h-3.5 w-3.5 text-blue-400" />
              <span>Status</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {activeDropdown === "status" && (
              <div className="absolute bottom-full mb-2 left-0 w-44 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 p-1.5 z-50 text-xs font-semibold animate-in fade-in duration-100">
                <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-100 mb-1">
                  Alterar para:
                </div>
                {(["prospect", "cliente", "inativo", "ex_cliente"] as CompanyStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      onChangeStatus(st);
                      setActiveDropdown(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-slate-100 rounded-lg flex items-center gap-2"
                  >
                    <span className={`h-2 w-2 rounded-full ${COMPANY_STATUS_CONFIG[st].dotClass}`} />
                    <span>{COMPANY_STATUS_CONFIG[st].label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Adicionar Tag */}
          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === "addTag" ? null : "addTag")}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Tag className="h-3.5 w-3.5 text-emerald-400" />
              <span>+ Tag</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {activeDropdown === "addTag" && (
              <div className="absolute bottom-full mb-2 left-0 w-48 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 p-1.5 z-50 text-xs font-semibold animate-in fade-in duration-100 max-h-48 overflow-y-auto">
                <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-100 mb-1">
                  Adicionar Tag:
                </div>
                {COMPANY_TAGS.map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      onAddTag(t);
                      setActiveDropdown(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-slate-100 rounded-lg"
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Criar Tarefa */}
          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === "task" ? null : "task")}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <CheckSquare className="h-3.5 w-3.5 text-purple-400" />
              <span>Criar Tarefa</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {activeDropdown === "task" && (
              <div className="absolute bottom-full mb-2 right-0 w-64 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in duration-100">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Tarefa em massa
                </label>
                <input
                  type="text"
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  placeholder="Ex: Realizar diagnóstico comercial Q3"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-indigo-600 mb-2"
                />
                <button
                  onClick={() => {
                    if (taskInput.trim()) {
                      onCreateBulkTask(taskInput.trim());
                      setTaskInput("");
                      setActiveDropdown(null);
                    }
                  }}
                  disabled={!taskInput.trim()}
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs"
                >
                  Agendar para {selectedCount} empresas
                </button>
              </div>
            )}
          </div>

          {/* Exportar */}
          <button
            onClick={onExportSelected}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition-colors"
            title="Exportar empresas selecionadas em CSV"
          >
            <Download className="h-3.5 w-3.5 text-sky-400" />
            <span className="hidden sm:inline">Exportar</span>
          </button>

          {/* Arquivar */}
          <button
            onClick={() => setShowArchiveConfirm(true)}
            className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-200 font-semibold rounded-xl text-xs flex items-center gap-1.5 border border-rose-800/80 transition-colors"
          >
            <Archive className="h-3.5 w-3.5 text-rose-400" />
            <span>Arquivar</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Bulk Archiving */}
      {showArchiveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 text-slate-800">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="font-extrabold text-lg text-slate-900">
                Arquivar {selectedCount} empresas?
              </h3>
            </div>

            <p className="text-xs font-medium text-slate-600 mb-5 leading-relaxed">
              Esta ação removerá as empresas selecionadas da visão ativa principal. Os relacionamentos, contatos e históricos serão preservados na base local.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowArchiveConfirm(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowArchiveConfirm(false);
                  onArchiveSelected();
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/20"
              >
                Confirmar Arquivamento
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
