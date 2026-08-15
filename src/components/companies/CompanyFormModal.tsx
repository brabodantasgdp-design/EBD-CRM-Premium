import React, { useState, useEffect } from "react";
import {
  X,
  Building2,
  AlertTriangle,
  Check,
  Globe,
  Phone,
  Mail,
  MapPin,
  Tag,
  User,
  ShieldAlert,
  ExternalLink,
} from "lucide-react";
import { CompanyItem, CompanyStatus } from "../../types/crm";
import {
  COMPANY_STATUS_CONFIG,
  COMPANY_SEGMENTS,
  COMPANY_SIZES,
  COMPANY_TAGS,
} from "../../constants/companyStatus";
import { MOCK_OWNERS } from "../../data/mockContactsData";
import { useCRM } from "../../context/CRMContext";
import { hasSupabaseConfiguration } from "../../lib/supabase/env";

interface CompanyFormModalProps {
  initialCompany?: CompanyItem | null;
  existingCompanies: CompanyItem[];
  onClose: () => void;
  onSave: (companyData: Partial<CompanyItem>) => void;
  onOpenExistingCompany?: (company: CompanyItem) => void;
}

export const CompanyFormModal: React.FC<CompanyFormModalProps> = ({
  initialCompany,
  existingCompanies,
  onClose,
  onSave,
  onOpenExistingCompany,
}) => {
  const { members, companies } = useCRM();
  const ownerOptions = hasSupabaseConfiguration() ? members : MOCK_OWNERS;
  const tagOptions = hasSupabaseConfiguration() ? Array.from(new Set(companies.flatMap((company) => company.tags ?? []))) : COMPANY_TAGS;
  const isEditing = !!initialCompany;

  // Form Fields State
  const [name, setName] = useState(initialCompany?.name || "");
  const [legalName, setLegalName] = useState(initialCompany?.legalName || "");
  const [cnpj, setCnpj] = useState(initialCompany?.cnpj || "");
  const [domain, setDomain] = useState(initialCompany?.domain || "");
  const [phone, setPhone] = useState(initialCompany?.phone || "");
  const [email, setEmail] = useState(initialCompany?.email || "");
  const [segment, setSegment] = useState(
    initialCompany?.segment || COMPANY_SEGMENTS[0]
  );
  const [size, setSize] = useState(initialCompany?.size || COMPANY_SIZES[2]);
  const [employeeCount, setEmployeeCount] = useState<string>(
    initialCompany?.employeeCount ? String(initialCompany.employeeCount) : ""
  );
  const [estimatedRevenue, setEstimatedRevenue] = useState(
    initialCompany?.estimatedRevenue || ""
  );
  const [status, setStatus] = useState<CompanyStatus>(
    initialCompany?.status || "prospect"
  );
  const [ownerId, setOwnerId] = useState(
    initialCompany?.ownerId || ownerOptions[0]?.id || ""
  );
  const [source, setSource] = useState(
    initialCompany?.source || "Prospecção Manual"
  );
  const [tags, setTags] = useState<string[]>(initialCompany?.tags || ["Enterprise"]);

  // Address
  const [zipCode, setZipCode] = useState(initialCompany?.address?.zipCode || "");
  const [street, setStreet] = useState(initialCompany?.address?.street || "");
  const [number, setNumber] = useState(initialCompany?.address?.number || "");
  const [complement, setComplement] = useState(
    initialCompany?.address?.complement || ""
  );
  const [neighborhood, setNeighborhood] = useState(
    initialCompany?.address?.neighborhood || ""
  );
  const [city, setCity] = useState(initialCompany?.address?.city || "");
  const [state, setState] = useState(initialCompany?.address?.state || "");
  const [country, setCountry] = useState(
    initialCompany?.address?.country || "Brasil"
  );

  // Custom Fields
  const [accountPotential, setAccountPotential] = useState(
    initialCompany?.customFields?.find((f) => f.label === "Potencial da Conta")
      ?.value || "Médio"
  );
  const [commercialRegion, setCommercialRegion] = useState(
    initialCompany?.customFields?.find((f) => f.label === "Região Comercial")
      ?.value || "Sudeste"
  );
  const [contractType, setContractType] = useState(
    initialCompany?.customFields?.find((f) => f.label === "Tipo de Contrato")
      ?.value || "Anual Recorrente"
  );
  const [strategicPriority, setStrategicPriority] = useState(
    initialCompany?.customFields?.find((f) => f.label === "Prioridade Estratégica")
      ?.value || "P1"
  );

  // Duplicate warning state
  const [duplicateWarning, setDuplicateWarning] = useState<{
    company: CompanyItem;
    reason: "cnpj" | "domain" | "name";
    message: string;
  } | null>(null);
  const [bypassDuplicate, setBypassDuplicate] = useState(false);

  // Check duplicate whenever key fields change
  useEffect(() => {
    if (isEditing || bypassDuplicate) return;

    const cleanCnpj = cnpj.replace(/\D/g, "");
    const cleanDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, "").replace(/^www\./, "");
    const cleanName = name.toLowerCase().trim();

    if (!cleanCnpj && !cleanDomain && cleanName.length < 3) {
      setDuplicateWarning(null);
      return;
    }

    // 1. Check CNPJ match
    if (cleanCnpj.length >= 8) {
      const matchCnpj = existingCompanies.find((c) => {
        const exCnpj = (c.cnpj || "").replace(/\D/g, "");
        return exCnpj && exCnpj === cleanCnpj;
      });
      if (matchCnpj) {
        setDuplicateWarning({
          company: matchCnpj,
          reason: "cnpj",
          message: `CNPJ idêntico (${matchCnpj.cnpj}) já cadastrado para "${matchCnpj.name}".`,
        });
        return;
      }
    }

    // 2. Check Domain match
    if (cleanDomain.length >= 4) {
      const matchDomain = existingCompanies.find((c) => {
        const exDom = (c.domain || "").toLowerCase().trim().replace(/^https?:\/\//, "").replace(/^www\./, "");
        return exDom && exDom === cleanDomain;
      });
      if (matchDomain) {
        setDuplicateWarning({
          company: matchDomain,
          reason: "domain",
          message: `Domínio/Site idêntico (${matchDomain.domain}) já pertence a "${matchDomain.name}".`,
        });
        return;
      }
    }

    // 3. Check Name similarity
    if (cleanName.length >= 3) {
      const matchName = existingCompanies.find((c) => {
        const exName = c.name.toLowerCase().trim();
        return exName === cleanName || (exName.length > 4 && cleanName.length > 4 && (exName.includes(cleanName) || cleanName.includes(exName)));
      });
      if (matchName) {
        setDuplicateWarning({
          company: matchName,
          reason: "name",
          message: `Nome empresarial semelhante ao de "${matchName.name}" já cadastrado.`,
        });
        return;
      }
    }

    setDuplicateWarning(null);
  }, [cnpj, domain, name, existingCompanies, isEditing, bypassDuplicate]);

  const toggleTag = (t: string) => {
    if (tags.includes(t)) {
      setTags(tags.filter((item) => item !== t));
    } else {
      setTags([...tags, t]);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!name.trim()) {
      alert("Por favor, preencha o Nome Fantasia da empresa.");
      return;
    }

    setIsSubmitting(true);

    const selectedOwner = ownerOptions.find((o) => o.id === ownerId) || ownerOptions[0];

    const companyData: Partial<CompanyItem> = {
      name: name.trim(),
      legalName: legalName.trim() || name.trim(),
      cnpj: cnpj.trim(),
      domain: domain.trim(),
      phone: phone.trim(),
      email: email.trim(),
      segment,
      size,
      employeeCount: employeeCount ? parseInt(employeeCount, 10) || employeeCount : undefined,
      estimatedRevenue: estimatedRevenue.trim() || undefined,
      status,
      ownerId: selectedOwner.id,
      ownerName: selectedOwner.name,
      ownerAvatar: selectedOwner.avatar,
      source,
      tags,
      address: {
        zipCode,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        country,
      },
      customFields: [
        { label: "Potencial da Conta", value: accountPotential },
        { label: "Região Comercial", value: commercialRegion },
        { label: "Tipo de Contrato", value: contractType },
        { label: "Prioridade Estratégica", value: strategicPriority },
      ],
      organizationId: initialCompany?.organizationId || "org-nexus-01",
      updatedAt: "agora mesmo",
    };

    try {
      onSave(companyData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shadow-2xs">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-lg">
                {isEditing ? `Editar: ${initialCompany.name}` : "Nova Empresa (Conta B2B)"}
              </h2>
              <p className="text-xs font-medium text-slate-500">
                Preencha os dados cadastrais e comerciais da organização
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Duplicate Warning Alert Banner */}
        {duplicateWarning && !bypassDuplicate && (
          <div className="p-4 bg-amber-50 border-b border-amber-200 flex items-start gap-3 text-amber-900 animate-in slide-in-from-top duration-150 shrink-0">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <span className="font-bold block text-sm text-amber-950">
                Possível empresa já cadastrada!
              </span>
              <p className="mt-0.5 text-amber-800 font-medium">{duplicateWarning.message}</p>
              <div className="flex items-center gap-2 mt-2">
                {onOpenExistingCompany && (
                  <button
                    type="button"
                    onClick={() => onOpenExistingCompany(duplicateWarning.company)}
                    className="px-2.5 py-1 bg-amber-200/80 hover:bg-amber-300 text-amber-950 font-bold rounded-lg text-[11px] flex items-center gap-1"
                  >
                    <span>Ver Empresa Existente</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setBypassDuplicate(true)}
                  className="px-2.5 py-1 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 font-bold rounded-lg text-[11px]"
                >
                  Continuar Cadastro Mesmo Assim
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form Body Scrollable */}
        <form id="companyForm" onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Section 1: Dados Principais */}
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Building2 className="h-4 w-4 text-indigo-600" />
              <span>Dados Principais</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Nome Fantasia *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Lumina Tech"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Razão Social</label>
                <input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="Ex: Lumina Tecnologia S.A."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">CNPJ</label>
                <input
                  type="text"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  placeholder="12.345.678/0001-90"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Globe className="h-3 w-3 text-slate-400" />
                  <span>Site / Domínio</span>
                </label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="luminatech.com.br"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Phone className="h-3 w-3 text-slate-400" />
                  <span>Telefone Corporativo</span>
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 3456-7890"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Mail className="h-3 w-3 text-slate-400" />
                  <span>E-mail Corporativo</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contato@empresa.com.br"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Origem do Cadastro</label>
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="Ex: Prospecção Outbound / Inbound"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Segmentação & Relacionamento Comercial */}
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <User className="h-4 w-4 text-indigo-600" />
              <span>Segmentação & Responsável</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Segmento de Mercado</label>
                <select
                  value={segment}
                  onChange={(e) => setSegment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600"
                >
                  {COMPANY_SEGMENTS.map((seg) => (
                    <option key={seg} value={seg}>
                      {seg}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Porte da Empresa</label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600"
                >
                  {COMPANY_SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status B2B *</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CompanyStatus)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-extrabold text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600"
                >
                  <option value="prospect">Prospect</option>
                  <option value="cliente">Cliente</option>
                  <option value="inativo">Inativo</option>
                  <option value="ex_cliente">Ex-cliente</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Responsável Comercial *</label>
                <select
                  value={ownerId}
                  onChange={(e) => setOwnerId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600"
                >
                  {ownerOptions.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nº de Funcionários</label>
                <input
                  type="text"
                  value={employeeCount}
                  onChange={(e) => setEmployeeCount(e.target.value)}
                  placeholder="Ex: 350"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Faturamento Estimado</label>
                <input
                  type="text"
                  value={estimatedRevenue}
                  onChange={(e) => setEstimatedRevenue(e.target.value)}
                  placeholder="Ex: R$ 45.000.000 / ano"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Endereço */}
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <MapPin className="h-4 w-4 text-indigo-600" />
              <span>Endereço Corporativo</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">CEP</label>
                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="04538-132"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Logradouro / Rua</label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Av. Brigadeiro Faria Lima"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Número</label>
                <input
                  type="text"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="3477"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Complemento</label>
                <input
                  type="text"
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  placeholder="12º Andar"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bairro</label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Itaim Bibi"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Cidade</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="São Paulo"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Estado (UF)</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="SP"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">País</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Brasil"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Campos Personalizados Demonstrativos */}
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Tag className="h-4 w-4 text-indigo-600" />
              <span>Campos Personalizados & Tags</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Potencial da Conta</label>
                <select
                  value={accountPotential}
                  onChange={(e) => setAccountPotential(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
                >
                  <option value="Baixo">Baixo</option>
                  <option value="Médio">Médio</option>
                  <option value="Alto">Alto</option>
                  <option value="Estratégico Alto">Estratégico Alto</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Região Comercial</label>
                <input
                  type="text"
                  value={commercialRegion}
                  onChange={(e) => setCommercialRegion(e.target.value)}
                  placeholder="Sudeste - SP Capital"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipo de Contrato</label>
                <input
                  type="text"
                  value={contractType}
                  onChange={(e) => setContractType(e.target.value)}
                  placeholder="Anual Recorrente (ARR)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Prioridade Estratégica</label>
                <select
                  value={strategicPriority}
                  onChange={(e) => setStrategicPriority(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
                >
                  <option value="P0 - Churn Zero">P0 - Churn Zero</option>
                  <option value="P1">P1 - Alta Prioridade</option>
                  <option value="P2">P2 - Normal</option>
                  <option value="P3">P3 - Baixa</option>
                </select>
              </div>
            </div>

            {/* Tags Selection */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Tags da Empresa</label>
              <div className="flex flex-wrap gap-1.5">
                {tagOptions.map((t) => {
                  const isSel = tags.includes(t);
                  return (
                    <button
                      type="button"
                      key={t}
                      onClick={() => toggleTag(t)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all flex items-center gap-1 ${
                        isSel
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {isSel && <Check className="h-3 w-3" />}
                      <span>{t}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-3xl flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-900 font-bold rounded-xl text-xs"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="companyForm"
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>{isEditing ? "Salvar Alterações" : "Cadastrar Empresa"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
