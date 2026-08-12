import React, { useState, useEffect } from "react";
import { X, UserPlus, AlertTriangle, Check, User, Building2, Mail, Phone, Tag, ShieldCheck } from "lucide-react";
import { ContactItem, ContactLifecycleStatus } from "../../types/crm";

interface ContactFormModalProps {
  initialContact?: ContactItem | null;
  existingContacts: ContactItem[];
  availableOwners: { id: string; name: string; avatar: string }[];
  availableTags: string[];
  onClose: () => void;
  onSave: (contactData: Partial<ContactItem>) => void;
  onViewExisting?: (existingContact: ContactItem) => void;
}

export const ContactFormModal: React.FC<ContactFormModalProps> = ({
  initialContact,
  existingContacts,
  availableOwners,
  availableTags,
  onClose,
  onSave,
  onViewExisting,
}) => {
  const isEditing = !!initialContact;

  const [firstName, setFirstName] = useState(initialContact?.firstName || "");
  const [lastName, setLastName] = useState(initialContact?.lastName || "");
  const [companyName, setCompanyName] = useState(initialContact?.companyName || "");
  const [jobTitle, setJobTitle] = useState(initialContact?.jobTitle || "");
  const [email, setEmail] = useState(initialContact?.email || "");
  const [phone, setPhone] = useState(initialContact?.phone || "");
  const [mobilePhone, setMobilePhone] = useState(initialContact?.mobilePhone || "");
  const [ownerId, setOwnerId] = useState(initialContact?.ownerId || availableOwners[0]?.id || "usr-1");
  const [lifecycleStatus, setLifecycleStatus] = useState<ContactLifecycleStatus>(
    initialContact?.lifecycleStatus || "active"
  );
  const [source, setSource] = useState(initialContact?.source || "Cadastro Manual");
  const [tags, setTags] = useState<string[]>(initialContact?.tags || []);
  const [notes, setNotes] = useState("");

  // Validation state
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // Duplicate warning state
  const [possibleDuplicate, setPossibleDuplicate] = useState<ContactItem | null>(null);
  const [ignoreDuplicateWarning, setIgnoreDuplicateWarning] = useState(false);

  // Real-time check for duplicate email / phone
  useEffect(() => {
    if (ignoreDuplicateWarning) return;

    const normEmail = email.trim().toLowerCase();
    const normPhone = (mobilePhone || phone).replace(/\D/g, "");

    if (!normEmail && !normPhone) {
      setPossibleDuplicate(null);
      return;
    }

    const match = existingContacts.find((c) => {
      if (initialContact && c.id === initialContact.id) return false;
      const cNormEmail = (c.email || "").trim().toLowerCase();
      const cNormPhone = (c.mobilePhone || c.phone || "").replace(/\D/g, "");

      const emailMatch = normEmail && cNormEmail && normEmail === cNormEmail;
      const phoneMatch = normPhone && cNormPhone && normPhone.length >= 8 && normPhone === cNormPhone;

      return emailMatch || phoneMatch;
    });

    setPossibleDuplicate(match || null);
  }, [email, phone, mobilePhone, existingContacts, initialContact, ignoreDuplicateWarning]);

  const handleTagToggle = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!firstName.trim()) {
      newErrors.firstName = "Nome é obrigatório";
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Informe um e-mail em formato válido";
    }

    if (!ownerId) {
      newErrors.ownerId = "Selecione o responsável pelo contato";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const selectedOwner = availableOwners.find((o) => o.id === ownerId);

    const contactPayload: Partial<ContactItem> = {
      firstName: firstName.trim(),
      lastName: lastName.trim() || undefined,
      fullName: `${firstName.trim()} ${lastName.trim()}`.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      mobilePhone: mobilePhone.trim() || undefined,
      companyName: companyName.trim() || undefined,
      jobTitle: jobTitle.trim() || undefined,
      ownerId: ownerId,
      ownerName: selectedOwner?.name || "Mariana Costa",
      ownerAvatar: selectedOwner?.avatar || availableOwners[0]?.avatar,
      lifecycleStatus: lifecycleStatus,
      source: source,
      tags: tags,
      updatedAt: "hoje às 16:00",
      companyData: companyName.trim()
        ? {
            id: `comp-${companyName.toLowerCase().replace(/\s+/g, "")}`,
            name: companyName.trim(),
            segment: "Tecnologia & Serviços",
            size: "100–250 funcionários",
            openDealsCount: 1,
          }
        : undefined,
    };

    onSave(contactPayload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isEditing ? "Editar Contato" : "Novo Contato"}
              </h3>
              <p className="text-xs text-slate-500">
                Preencha os dados do contato comercial
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Duplicate Warning Banner */}
        {possibleDuplicate && !ignoreDuplicateWarning && (
          <div className="my-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2.5 animate-in fade-in duration-200">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900">
                  Possível contato duplicado encontrado!
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  Já existe um contato com e-mail ou telefone idêntico cadastrado:{" "}
                  <strong>{possibleDuplicate.fullName}</strong> ({possibleDuplicate.companyName || "Sem empresa"}).
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200/80">
              {onViewExisting && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onViewExisting(possibleDuplicate);
                  }}
                  className="px-3 py-1.5 text-xs font-bold bg-white text-amber-900 border border-amber-300 rounded-xl hover:bg-amber-100"
                >
                  Ver Contato Existente
                </button>
              )}
              <button
                type="button"
                onClick={() => setIgnoreDuplicateWarning(true)}
                className="px-3 py-1.5 text-xs font-bold bg-amber-600 text-white rounded-xl hover:bg-amber-700 shadow-2xs"
              >
                Continuar Mesmo Assim
              </button>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Nome */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nome *
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ex: Ana, Carlos..."
                className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:bg-white text-slate-900 ${
                  errors.firstName
                    ? "border-rose-500 focus:border-rose-500"
                    : "border-slate-200 focus:border-indigo-600"
                }`}
              />
              {errors.firstName && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.firstName}</p>
              )}
            </div>

            {/* Sobrenome */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sobrenome
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Ex: Martins, Silva..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-600 text-slate-900"
              />
            </div>

            {/* Empresa */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Empresa
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ex: Lumina Tech, Grupo Horizonte..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-600 text-slate-900"
              />
            </div>

            {/* Cargo */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cargo / Função
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Ex: Diretora Comercial, Gerente de TI..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-600 text-slate-900"
              />
            </div>

            {/* E-mail */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@empresa.com.br"
                className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:bg-white text-slate-900 ${
                  errors.email
                    ? "border-rose-500 focus:border-rose-500"
                    : "border-slate-200 focus:border-indigo-600"
                }`}
              />
              {errors.email && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.email}</p>
              )}
            </div>

            {/* Celular / WhatsApp */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Celular / WhatsApp
              </label>
              <input
                type="text"
                value={mobilePhone}
                onChange={(e) => setMobilePhone(e.target.value)}
                placeholder="(11) 99876-5432"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-600 text-slate-900"
              />
            </div>

            {/* Telefone Fixo */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Telefone Fixo
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 3456-7890"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-600 text-slate-900"
              />
            </div>

            {/* Responsável */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Responsável *
              </label>
              <select
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-600 text-slate-900 font-semibold"
              >
                {availableOwners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Lifecycle Status */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Status do Contato
              </label>
              <select
                value={lifecycleStatus}
                onChange={(e) =>
                  setLifecycleStatus(e.target.value as ContactLifecycleStatus)
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-600 text-slate-900 font-bold"
              >
                <option value="active">Ativo</option>
                <option value="customer">Cliente</option>
                <option value="inactive">Inativo</option>
                <option value="former_customer">Ex-cliente</option>
              </select>
            </div>

            {/* Origem */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Origem
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-600 text-slate-900"
              >
                <option value="Cadastro Manual">Cadastro Manual</option>
                <option value="Lead Convertido">Lead Convertido</option>
                <option value="Indicação Direta">Indicação Direta</option>
                <option value="Prospecção Outbound">Prospecção Outbound</option>
                <option value="Evento Presencial">Evento Presencial</option>
                <option value="Site Inbound">Site Inbound</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Etiquetas / Tags
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl max-h-24 overflow-y-auto">
              {availableTags.map((tag) => {
                const isSelected = tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-2xs"
                        : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
                    }`}
                  >
                    <span>{tag}</span>
                    {isSelected && <Check className="h-3 w-3" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/30 transition-all active:scale-95"
            >
              {isEditing ? "Salvar Alterações" : "Cadastrar Contato"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
