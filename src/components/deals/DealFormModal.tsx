import React, { useState, useEffect } from "react";
import { X, Building2, User, DollarSign, Calendar, Tag, GitBranch, Save, MessageSquare } from "lucide-react";
import { DealItem, CompanyItem, ContactItem } from "../../types/crm";
import { PipelineConfig, PipelineStageConfig, MOCK_PIPELINES } from "../../data/mockPipelinesData";
import { formatDateToISO, getLocalDateString } from "../../utils/formatters";

interface DealFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealToEdit?: DealItem | null;
  initialStage?: PipelineStageConfig | null;
  initialPipeline?: PipelineConfig | null;
  availableCompanies: CompanyItem[];
  availableContacts: ContactItem[];
  availableOwners: { id: string; name: string }[];
  availablePipelines?: PipelineConfig[];
  onSave: (dealData: Partial<DealItem>) => void;
}

export const DealFormModal: React.FC<DealFormModalProps> = ({
  isOpen,
  onClose,
  dealToEdit,
  initialStage,
  initialPipeline,
  availableCompanies,
  availableContacts,
  availableOwners,
  availablePipelines = MOCK_PIPELINES,
  onSave,
}) => {
  const [name, setName] = useState("");
  const [pipelineId, setPipelineId] = useState("pipe-b2b");
  const [stageId, setStageId] = useState("stg-qual");
  const [value, setValue] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [contactId, setContactId] = useState("");
  const [ownerId, setOwnerId] = useState("usr-1");
  const [expectedCloseDate, setExpectedCloseDate] = useState("");
  const [source, setSource] = useState("Manual");
  const [tagsInput, setTagsInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active pipeline object
  const activePipeline = availablePipelines.find((p) => p.id === pipelineId) || availablePipelines[0] || null;

  // Active stages for current pipeline
  const activeStages = activePipeline?.stages ?? [];

  useEffect(() => {
    if (dealToEdit) {
      setName(dealToEdit.name || "");
      setPipelineId(dealToEdit.pipelineId || "pipe-b2b");
      setStageId(dealToEdit.stageId || "stg-qual");
      setValue(dealToEdit.value ? String(dealToEdit.value) : "");
      setCompanyId(dealToEdit.companyId || "");
      setContactId(dealToEdit.contactId || "");
      setOwnerId(dealToEdit.ownerId || "usr-1");
      setExpectedCloseDate(formatDateToISO(dealToEdit.expectedCloseDate));
      setSource(dealToEdit.source || "Manual");
      setTagsInput(dealToEdit.tags ? dealToEdit.tags.join(", ") : "");
      setNotesInput("");
    } else {
      setName("");
      const targetPipe = initialPipeline || availablePipelines[0];
      if (!targetPipe) return;
      setPipelineId(targetPipe.id);
      const targetStage = initialStage || targetPipe.stages[0];
      setStageId(targetStage.id);
      setValue("");
      setCompanyId("");
      setContactId("");
      setOwnerId("usr-1");

      // Default close date = +30 days (ISO format YYYY-MM-DD for date input)
      const future = new Date();
      future.setDate(future.getDate() + 30);
      setExpectedCloseDate(getLocalDateString(future));
      setSource("Manual");
      setTagsInput("");
      setNotesInput("");
    }
  }, [dealToEdit, initialStage, initialPipeline, isOpen]);

  // When pipeline changes, reset stageId to first stage of new pipeline if current stage is invalid
  const handlePipelineChange = (newPipeId: string) => {
    setPipelineId(newPipeId);
    const selectedPipe = availablePipelines.find((p) => p.id === newPipeId);
    if (selectedPipe && selectedPipe.stages.length > 0) {
      setStageId(selectedPipe.stages[0].id);
    }
  };

  // Filter contacts by selected company
  const filteredContacts = companyId
    ? availableContacts.filter((c) => c.companyId === companyId)
    : availableContacts;

  // When company is selected, inherit owner if possible
  const handleCompanyChange = (cId: string) => {
    setCompanyId(cId);
    setContactId("");
    if (cId) {
      const comp = availableCompanies.find((c) => c.id === cId);
      if (comp && comp.ownerId) {
        setOwnerId(comp.ownerId);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);

    const selectedPipe = availablePipelines.find((p) => p.id === pipelineId);
    const selectedStage = selectedPipe?.stages.find((s) => s.id === stageId);
    const selectedCompany = availableCompanies.find((c) => c.id === companyId);
    const selectedContact = availableContacts.find((c) => c.id === contactId);
    const selectedOwner = availableOwners.find((o) => o.id === ownerId);

    const numericValue = parseFloat(value.replace(/[^\d.]/g, "")) || 0;
    const tagsArray = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    // Preserve existing notes and append new note if provided
    let existingNotes = dealToEdit?.notes ? [...dealToEdit.notes] : [];
    if (notesInput.trim()) {
      const newNote = {
        id: `not-${Date.now()}`,
        authorName: selectedOwner?.name || "Mariana Costa",
        content: notesInput.trim(),
        createdAt: `${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
      };
      existingNotes = [newNote, ...existingNotes];
    }

    const payload: Partial<DealItem> = {
      name: name.trim(),
      pipelineId,
      pipelineName: selectedPipe?.name || "Vendas B2B Complexas",
      stageId,
      stageName: selectedStage?.name || "Qualificação",
      probability: selectedStage?.probability ?? 20,
      value: numericValue,
      companyId: selectedCompany?.id || undefined,
      companyName: selectedCompany?.name || undefined,
      contactId: selectedContact?.id || undefined,
      contactName: selectedContact?.fullName || undefined,
      ownerId: selectedOwner?.id || "usr-1",
      ownerName: selectedOwner?.name || "Mariana Costa",
      // Keep the native date input format for the PostgreSQL date column.
      expectedCloseDate: expectedCloseDate || undefined,
      source,
      tags: tagsArray,
      notes: existingNotes,
    };

    onSave(payload);
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;
  if (!activePipeline) return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 text-center"><h3 className="font-bold text-slate-900">Nenhum pipeline disponível</h3><p className="mt-2 text-sm text-slate-500">Crie um pipeline antes de cadastrar um negócio.</p><button type="button" onClick={onClose} className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white">Fechar</button></div></div>;

  return (
    <div data-testid="deal-form-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">
                {dealToEdit ? "Editar Negócio" : "Criar Novo Negócio"}
              </h3>
              <p className="text-xs text-slate-500">
                Preencha as informações para registrar a oportunidade no funil.
              </p>
            </div>
          </div>
          <button
            data-testid="deal-form-cancel"
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nome do Negócio */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Nome da Oportunidade <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Expansão Licenciamento Enterprise"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-sm font-medium text-slate-900 outline-hidden transition-all"
            />
          </div>

          {/* Pipeline & Stage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Pipeline / Funil <span className="text-rose-500">*</span>
              </label>
              <select
                value={pipelineId}
                onChange={(e) => handlePipelineChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-sm font-medium text-slate-800 outline-hidden cursor-pointer"
              >
                {availablePipelines.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Etapa do Funil <span className="text-rose-500">*</span>
              </label>
              <select
                data-testid="deal-stage-field"
                value={stageId}
                onChange={(e) => setStageId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-sm font-medium text-slate-800 outline-hidden cursor-pointer"
              >
                {activeStages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.probability}%)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Value & Close Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Valor Estimado (R$) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  data-testid="deal-value-field"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-sm font-extrabold text-slate-900 outline-hidden transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Previsão de Fechamento
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={expectedCloseDate}
                  onChange={(e) => setExpectedCloseDate(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-sm font-medium text-slate-900 outline-hidden transition-all"
                />
              </div>
            </div>
          </div>

          {/* Empresa & Contato Vinculado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" /> Empresa
              </label>
              <select
                value={companyId}
                onChange={(e) => handleCompanyChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-sm font-medium text-slate-800 outline-hidden cursor-pointer"
              >
                <option value="">Nenhuma / Empresa Não Cadastrada</option>
                {availableCompanies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" /> Contato
              </label>
              <select
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-sm font-medium text-slate-800 outline-hidden cursor-pointer"
              >
                <option value="">Nenhum contato selecionado</option>
                {filteredContacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} {c.jobTitle ? `(${c.jobTitle})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Owner & Source */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Responsável Comercial
              </label>
              <select
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-sm font-medium text-slate-800 outline-hidden cursor-pointer"
              >
                {availableOwners.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Origem do Negócio
              </label>
              <input
                type="text"
                placeholder="Ex: Inbound Website, Google Ads, Indicação"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-sm font-medium text-slate-900 outline-hidden transition-all"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" /> Tags (separadas por vírgula)
            </label>
            <input
              type="text"
              placeholder="Ex: Enterprise, Expansão, Urgente"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-sm font-medium text-slate-900 outline-hidden transition-all"
            />
          </div>

          {/* Observações / Notas */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" /> Adicionar Nota / Observação
              </span>
              {dealToEdit?.notes && dealToEdit.notes.length > 0 && (
                <span className="text-[11px] text-slate-500 font-normal">
                  ({dealToEdit.notes.length} nota(s) existente(s) preservada(s))
                </span>
              )}
            </label>
            <textarea
              rows={2}
              placeholder="Digite uma observação adicional para este negócio (será anexada como nova nota)..."
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-sm font-medium text-slate-900 outline-hidden transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? "Salvando..." : dealToEdit ? "Atualizar Negócio" : "Criar Negócio"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
