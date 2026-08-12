import React, { useState, useEffect } from "react";
import { X, Calendar, Clock, User, Tag, FileText, AlertCircle, Link } from "lucide-react";
import { TaskItem } from "../../types/crm";
import { useCRM } from "../../context/CRMContext";

export const MOCK_TASK_OWNERS = [
  { id: "usr-1", name: "Mariana Costa" },
  { id: "usr-2", name: "Lucas Mendes" },
  { id: "usr-3", name: "Camila Rocha" },
  { id: "usr-4", name: "Roberto Alves" },
];

interface TaskFormModalProps {
  isOpen: boolean;
  taskToEdit?: TaskItem | null;
  initialEntity?: {
    entityType: "lead" | "contact" | "company" | "deal";
    entityId: string;
    entityName: string;
  };
  onClose: () => void;
  onSave: (taskData: Partial<TaskItem>) => void;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  taskToEdit,
  initialEntity,
  onClose,
  onSave,
}) => {
  const { contacts, companies, deals } = useCRM();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ownerId, setOwnerId] = useState("usr-1");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("12:00");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [entityType, setEntityType] = useState<"none" | "lead" | "contact" | "company" | "deal">("none");
  const [entityId, setEntityId] = useState("");
  const [entityName, setEntityName] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Sample leads for entity dropdown selection
  const mockLeadsOptions = [
    { id: "lead-1", name: "Carlos Silva (Silva Consultoria)" },
    { id: "lead-2", name: "Fernanda Lima (Inova Tech)" },
    { id: "lead-3", name: "Marcos Oliveira (Logística Brasil)" },
  ];

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || "");
      setDescription(taskToEdit.description || "");
      setOwnerId(taskToEdit.ownerId || "usr-1");
      setDueDate(taskToEdit.dueDate || new Date().toISOString().split("T")[0]);
      setDueTime(taskToEdit.dueTime || "12:00");
      setPriority(taskToEdit.priority || "medium");
      setEntityType(taskToEdit.entityType || "none");
      setEntityId(taskToEdit.entityId || "");
      setEntityName(taskToEdit.entityName || "");
      setTagsInput((taskToEdit.tags || []).join(", "));
    } else {
      // Default new task
      const today = new Date().toISOString().split("T")[0];
      setTitle("");
      setDescription("");
      setOwnerId("usr-1");
      setDueDate(today);
      setDueTime("12:00");
      setPriority("medium");
      
      if (initialEntity) {
        setEntityType(initialEntity.entityType);
        setEntityId(initialEntity.entityId);
        setEntityName(initialEntity.entityName);
      } else {
        setEntityType("none");
        setEntityId("");
        setEntityName("");
      }
      setTagsInput("");
    }
    setErrorMsg("");
  }, [taskToEdit, initialEntity, isOpen]);

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
      setErrorMsg("O título da tarefa é obrigatório.");
      return;
    }
    if (!dueDate) {
      setErrorMsg("A data de entrega é obrigatória.");
      return;
    }

    const ownerObj = MOCK_TASK_OWNERS.find((o) => o.id === ownerId);
    const parsedTags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const taskPayload: Partial<TaskItem> = {
      title: title.trim(),
      description: description.trim(),
      ownerId: ownerId || "usr-1",
      ownerName: ownerObj ? ownerObj.name : "Mariana Costa",
      dueDate,
      dueTime,
      priority,
      entityType: entityType !== "none" ? entityType : undefined,
      entityId: entityType !== "none" ? entityId : undefined,
      entityName: entityType !== "none" ? entityName : undefined,
      tags: parsedTags,
    };

    onSave(taskPayload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {taskToEdit ? "Editar Tarefa" : "Nova Tarefa"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {taskToEdit ? "Atualize os detalhes da tarefa" : "Crie uma nova ação operacional para a equipe"}
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

          {/* Título */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Título da Tarefa <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Enviar proposta comercial para CTO..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Descrição
            </label>
            <textarea
              rows={3}
              placeholder="Adicione detalhes, instruções ou notas adicionais..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Grid 2 Cols: Responsável & Prioridade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Responsável
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <select
                  value={ownerId}
                  onChange={(e) => setOwnerId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {MOCK_TASK_OWNERS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Prioridade
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
              </select>
            </div>
          </div>

          {/* Grid 2 Cols: Data & Hora de Entrega */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Prazo de Entrega <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Horário
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Relacionado a (Entidade) */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center gap-2">
              <Link className="h-4 w-4 text-indigo-500" />
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

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tags (separadas por vírgula)
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Ex: Proposta, Urgente, B2B..."
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
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
              {taskToEdit ? "Salvar Alterações" : "Criar Tarefa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
