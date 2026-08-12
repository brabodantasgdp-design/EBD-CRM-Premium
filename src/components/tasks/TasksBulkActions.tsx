import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  Clock,
  User,
  AlertTriangle,
  Archive,
  Calendar,
  RotateCcw,
} from "lucide-react";
import { MOCK_TASK_OWNERS } from "./TaskFormModal";

interface TasksBulkActionsProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkComplete: () => void;
  onBulkReopen: () => void;
  onBulkArchive: () => void;
  onBulkChangeOwner: (ownerId: string, ownerName: string) => void;
  onBulkChangePriority: (priority: "low" | "medium" | "high") => void;
  onBulkChangeDueDate: (dueDate: string) => void;
}

export const TasksBulkActions: React.FC<TasksBulkActionsProps> = ({
  selectedCount,
  onClearSelection,
  onBulkComplete,
  onBulkReopen,
  onBulkArchive,
  onBulkChangeOwner,
  onBulkChangePriority,
  onBulkChangeDueDate,
}) => {
  const [showOwnerMenu, setShowOwnerMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [newDueDate, setNewDueDate] = useState("");

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/80 flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-200 max-w-[95vw] sm:max-w-auto">
        <div className="flex items-center gap-2 pr-3 border-r border-slate-700">
          <span className="flex items-center justify-center h-6 w-6 rounded-full bg-indigo-500 text-white text-xs font-bold">
            {selectedCount}
          </span>
          <span className="text-xs font-medium hidden sm:inline">
            tarefa{selectedCount > 1 ? "s" : ""} selecionada{selectedCount > 1 ? "s" : ""}
          </span>
        </div>

        {/* Complete */}
        <button
          onClick={onBulkComplete}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Concluir</span>
        </button>

        {/* Reopen */}
        <button
          onClick={onBulkReopen}
          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reabrir</span>
        </button>

        {/* Alterar Responsável Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowOwnerMenu(!showOwnerMenu);
              setShowPriorityMenu(false);
            }}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <User className="h-3.5 w-3.5 text-indigo-400" />
            <span>Responsável</span>
          </button>

          {showOwnerMenu && (
            <div className="absolute bottom-full mb-2 left-0 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-700">
                Atribuir para
              </div>
              {MOCK_TASK_OWNERS.map((o) => (
                <button
                  key={o.id}
                  onClick={() => {
                    onBulkChangeOwner(o.id, o.name);
                    setShowOwnerMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-2"
                >
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  <span>{o.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Alterar Prioridade Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowPriorityMenu(!showPriorityMenu);
              setShowOwnerMenu(false);
            }}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            <span>Prioridade</span>
          </button>

          {showPriorityMenu && (
            <div className="absolute bottom-full mb-2 left-0 w-40 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
              <button
                onClick={() => {
                  onBulkChangePriority("high");
                  setShowPriorityMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-slate-700 font-semibold transition-colors"
              >
                Alta
              </button>
              <button
                onClick={() => {
                  onBulkChangePriority("medium");
                  setShowPriorityMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-xs text-amber-400 hover:bg-slate-700 font-semibold transition-colors"
              >
                Média
              </button>
              <button
                onClick={() => {
                  onBulkChangePriority("low");
                  setShowPriorityMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-xs text-blue-400 hover:bg-slate-700 font-semibold transition-colors"
              >
                Baixa
              </button>
            </div>
          )}
        </div>

        {/* Alterar Prazo */}
        <button
          onClick={() => {
            setShowDateModal(true);
            setShowOwnerMenu(false);
            setShowPriorityMenu(false);
          }}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
        >
          <Calendar className="h-3.5 w-3.5 text-indigo-400" />
          <span>Alterar Prazo</span>
        </button>

        {/* Archive */}
        <button
          onClick={onBulkArchive}
          className="px-3 py-1.5 bg-slate-800 hover:bg-red-900/50 hover:text-red-300 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
        >
          <Archive className="h-3.5 w-3.5" />
          <span>Arquivar</span>
        </button>

        {/* Clear selection */}
        <button
          onClick={onClearSelection}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors ml-1"
          title="Limpar seleção"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Date change modal */}
      {showDateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl max-w-sm w-full space-y-4">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Alterar Prazo para {selectedCount} tarefa(s)
            </h4>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Nova Data de Entrega
              </label>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDateModal(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (newDueDate) {
                    onBulkChangeDueDate(newDueDate);
                    setShowDateModal(false);
                  }
                }}
                disabled={!newDueDate}
                className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold disabled:opacity-50"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
