import React, { useState, useEffect } from "react";
import { X, Sparkles, AlertCircle, Check } from "lucide-react";
import { LeadItem, LeadStatus, LeadSourceType } from "../../types/crm";
import { MOCK_OWNERS, MOCK_TAGS } from "../../data/mockLeadsData";

interface LeadFormModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  initialLead?: LeadItem | null;
  onClose: () => void;
  onSubmitSuccess: (lead: Partial<LeadItem>) => void;
  existingEmails?: string[];
}

export const LeadFormModal: React.FC<LeadFormModalProps> = ({
  isOpen,
  mode,
  initialLead,
  onClose,
  onSubmitSuccess,
  existingEmails = ["ana.martins@luminatech.com.br"],
}) => {
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    jobTitle: "",
    email: "",
    phone: "",
    status: "new" as LeadStatus,
    source: "Site" as LeadSourceType,
    ownerId: "usr-1",
    tags: [] as string[],
    notes: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [dedupWarning, setDedupWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialLead && mode === "edit") {
      setFormData({
        name: initialLead.name || "",
        company: initialLead.company || "",
        jobTitle: initialLead.jobTitle || "",
        email: initialLead.email || "",
        phone: initialLead.phone || "",
        status: initialLead.status || "new",
        source: initialLead.source || "Site",
        ownerId: initialLead.ownerId || "usr-1",
        tags: initialLead.tags || [],
        notes: "",
      });
    } else {
      setFormData({
        name: "",
        company: "",
        jobTitle: "",
        email: "",
        phone: "",
        status: "new",
        source: "Site",
        ownerId: "usr-1",
        tags: [],
        notes: "",
      });
    }
    setErrors({});
    setDedupWarning(null);
  }, [initialLead, mode, isOpen]);

  if (!isOpen) return null;

  const handleEmailChange = (val: string) => {
    setFormData((prev) => ({ ...prev, email: val }));
    if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));

    // Check deduplication alert
    if (
      val.trim().length > 5 &&
      existingEmails.some((e) => e.toLowerCase() === val.trim().toLowerCase()) &&
      (!initialLead || initialLead.email?.toLowerCase() !== val.trim().toLowerCase())
    ) {
      setDedupWarning(`Aviso: Já existe um lead cadastrado com o e-mail "${val.trim()}".`);
    } else {
      setDedupWarning(null);
    }
  };

  const handleToggleTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "O nome do lead é obrigatório.";
    }

    if (
      formData.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
    ) {
      newErrors.email = "Formato de e-mail inválido (exemplo@dominio.com).";
    }

    if (!formData.status) {
      newErrors.status = "O status é obrigatório.";
    }

    if (!formData.ownerId) {
      newErrors.ownerId = "Selecione um responsável.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    const selectedOwner = MOCK_OWNERS.find((o) => o.id === formData.ownerId);

    setTimeout(() => {
      setIsSubmitting(false);
      onSubmitSuccess({
        id: initialLead?.id || `lead-${Date.now()}`,
        name: formData.name.trim(),
        company: formData.company.trim(),
        jobTitle: formData.jobTitle.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        status: formData.status,
        source: formData.source,
        ownerId: formData.ownerId,
        ownerName: selectedOwner?.name || "Mariana Costa",
        ownerAvatar: selectedOwner?.avatar,
        tags: formData.tags,
        score: initialLead?.score ?? 65,
        createdAt: initialLead?.createdAt || new Date().toLocaleDateString("pt-BR"),
        updatedAt: "agora",
        lastActivityText: "agora",
      });
      onClose();
    }, 600);
  };

  return (
    <div data-testid="lead-form-modal" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] overflow-y-auto z-10 flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {mode === "create" ? "Novo Lead" : "Editar Lead"}
            </h2>
            <p className="text-xs text-slate-500">
              {mode === "create"
                ? "Preencha as informações do lead para qualificação."
                : "Atualize os dados e responsável do lead."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Deduplication Alert Banner */}
        {dedupWarning && (
          <div className="m-4 mb-0 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{dedupWarning}</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Verifique se o lead já não consta na base antes de prosseguir.
              </p>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs">
          {/* Nome completo (Obrigatório) */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nome do Lead <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: "" });
              }}
              placeholder="Ex: Ana Martins"
              className={`w-full px-3 py-2 rounded-xl border ${
                errors.name ? "border-rose-500 bg-rose-50/20" : "border-slate-200"
              } text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20`}
            />
            {errors.name && (
              <p className="text-[11px] font-medium text-rose-600 mt-1">
                {errors.name}
              </p>
            )}
          </div>

          {/* Grid: Empresa & Cargo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Empresa
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
                placeholder="Ex: Lumina Tech"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Cargo
              </label>
              <input
                type="text"
                value={formData.jobTitle}
                onChange={(e) =>
                  setFormData({ ...formData, jobTitle: e.target.value })
                }
                placeholder="Ex: Diretora Comercial"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Grid: E-mail & Telefone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                E-mail
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="ana.martins@empresa.com.br"
                className={`w-full px-3 py-2 rounded-xl border ${
                  errors.email ? "border-rose-500 bg-rose-50/20" : "border-slate-200"
                } text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20`}
              />
              {errors.email && (
                <p className="text-[11px] font-medium text-rose-600 mt-1">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="(11) 98765-4321"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Grid: Status, Responsável, Origem */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Status <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as LeadStatus,
                  })
                }
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="new">Novo</option>
                <option value="contacted">Em contato</option>
                <option value="qualified">Qualificado</option>
                <option value="nurturing">Nutrição</option>
                <option value="converted">Convertido</option>
                <option value="disqualified">Desqualificado</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Responsável <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.ownerId}
                onChange={(e) =>
                  setFormData({ ...formData, ownerId: e.target.value })
                }
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              >
                {MOCK_OWNERS.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Origem
              </label>
              <select
                value={formData.source}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    source: e.target.value as LeadSourceType,
                  })
                }
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="Indicação">Indicação</option>
                <option value="Site">Site</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Prospecção">Prospecção</option>
                <option value="Evento">Evento</option>
                <option value="Formulário">Formulário</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Tags
            </label>
            <div className="flex flex-wrap gap-1.5">
              {MOCK_TAGS.map((tag) => {
                const isSelected = formData.tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Observações
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Anotações iniciais do primeiro contato..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              data-testid="lead-form-submit"
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-xs active:scale-98 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Salvando...</span>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>{mode === "create" ? "Criar Lead" : "Salvar Alterações"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
