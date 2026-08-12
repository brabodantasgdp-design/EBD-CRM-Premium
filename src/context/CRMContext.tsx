import React, { createContext, useContext, useState } from "react";
import {
  ContactItem,
  CompanyItem,
  DealItem,
  TaskItem,
  ActivityItem,
  LeadItem,
  LeadStatus,
  ContactLifecycleStatus,
  CompanyStatus,
  CRMContextType,
} from "../types/crm";
import { MOCK_CONTACTS } from "../data/mockContactsData";
import { MOCK_COMPANIES_DATA } from "../data/mockCompaniesData";
import { MOCK_TASKS_SEED } from "../data/mockTasksData";
import { MOCK_ACTIVITIES_SEED } from "../data/mockActivitiesData";
import { MOCK_LEADS } from "../data/mockLeadsData";
import { getLocalDateString } from "../utils/formatters";

export const INITIAL_DEALS: DealItem[] = [
  {
    id: "deal-101",
    organizationId: "org-nexus-01",
    name: "Expansão Lumina Enterprise",
    value: 45000,
    formattedValue: "R$ 45.000",
    pipelineId: "pipe-b2b",
    pipelineName: "Vendas B2B Complexas",
    stageId: "stg-diag",
    stageName: "Diagnóstico",
    probability: 40,
    assigneeName: "Mariana Costa",
    ownerId: "usr-1",
    ownerName: "Mariana Costa",
    companyId: "comp-lumina",
    companyName: "Lumina Tech",
    contactId: "cnt-1",
    contactName: "Ana Martins",
    expectedCloseDate: "28/08/2026",
    status: "open",
    tags: ["Enterprise", "Expansão"],
    source: "Inbound Website",
    createdAt: "10/08/2026",
    updatedAt: "11/08/2026",
    lastActivityAt: "10/08/2026",
    lastActivityText: "Reunião de alinhamento com CTO realizada",
    nextTaskAt: "14/08/2026",
    nextTaskText: "Enviar minuta da proposta técnica",
    products: [
      {
        id: "prod-1",
        name: "Licença Enterprise Nexus",
        quantity: 15,
        unitPrice: 2500,
        totalPrice: 37500,
        category: "SaaS",
      },
      {
        id: "prod-2",
        name: "Onboarding & Migração VIP",
        quantity: 1,
        unitPrice: 7500,
        totalPrice: 7500,
        category: "Serviços",
      },
    ],
    activities: [
      {
        id: "act-101-1",
        type: "meeting",
        title: "Reunião de Diagnóstico de Infraestrutura",
        description: "Alinhado escopo de integração com o time de TI da Lumina Tech.",
        authorName: "Mariana Costa",
        createdAt: "10/08/2026 14:30",
      },
      {
        id: "act-101-2",
        type: "call",
        title: "Call de Alinhamento com Ana Martins",
        description: "Confirmado interesse nos módulos adicionais de BI e CRM.",
        authorName: "Mariana Costa",
        createdAt: "08/08/2026 10:15",
      },
    ],
    tasks: [
      {
        id: "tsk-101-1",
        title: "Enviar minuta da proposta técnica",
        dueDate: "14/08/2026",
        dueTime: "15:00",
        assigneeName: "Mariana Costa",
        completed: false,
        priority: "alta",
      },
    ],
    notes: [
      {
        id: "not-101-1",
        authorName: "Mariana Costa",
        content: "Decisor técnico é o CTO Pedro Sampaio. Orçamento já aprovado para Q3.",
        createdAt: "10/08/2026 15:00",
      },
    ],
    stageHistory: [
      {
        id: "his-1",
        dealId: "deal-101",
        fromStageId: "stg-qual",
        fromStageName: "Qualificação",
        toStageId: "stg-diag",
        toStageName: "Diagnóstico",
        changedBy: "Mariana Costa",
        changedAt: "10/08/2026 11:00",
      },
    ],
    customFields: [
      { label: "Concorrente Principal", value: "Salesforce" },
      { label: "Urgência", value: "Alta (Q3)" },
    ],
  },
  {
    id: "deal-102",
    organizationId: "org-nexus-01",
    name: "Renovação Anual de Licenças",
    value: 18500,
    formattedValue: "R$ 18.500",
    pipelineId: "pipe-renewals",
    pipelineName: "Renovações & Expansão",
    stageId: "stg-ren-neg",
    stageName: "Negociação",
    probability: 85,
    assigneeName: "Lucas Mendes",
    ownerId: "usr-2",
    ownerName: "Lucas Mendes",
    companyId: "comp-lumina",
    companyName: "Lumina Tech",
    contactId: "cnt-1",
    contactName: "Ana Martins",
    expectedCloseDate: "15/09/2026",
    status: "open",
    tags: ["Renovação"],
    source: "Base Ativa CS",
    createdAt: "10/08/2026",
    updatedAt: "11/08/2026",
    lastActivityAt: "09/08/2026",
    lastActivityText: "E-mail com condições comerciais enviado",
    nextTaskAt: "18/08/2026",
    nextTaskText: "Cobrar aceite da renovação",
    products: [
      {
        id: "prod-3",
        name: "Renovação Anual Pro",
        quantity: 1,
        unitPrice: 18500,
        totalPrice: 18500,
        category: "SaaS",
      },
    ],
    activities: [
      {
        id: "act-102-1",
        type: "email",
        title: "Proposta de Renovação com Desconto de Fidelidade",
        description: "Enviado PDF com 10% de desconto para pagamento antecipado.",
        authorName: "Lucas Mendes",
        createdAt: "09/08/2026 16:20",
      },
    ],
    tasks: [],
    notes: [],
    stageHistory: [
      {
        id: "his-2",
        dealId: "deal-102",
        fromStageId: "stg-ren-prop",
        fromStageName: "Proposta de Renovação",
        toStageId: "stg-ren-neg",
        toStageName: "Negociação",
        changedBy: "Lucas Mendes",
        changedAt: "09/08/2026 16:30",
      },
    ],
  },
  {
    id: "deal-201",
    organizationId: "org-nexus-01",
    name: "Mapeamento Operacional CRM",
    value: 32000,
    formattedValue: "R$ 32.000",
    pipelineId: "pipe-b2b",
    pipelineName: "Vendas B2B Complexas",
    stageId: "stg-prop",
    stageName: "Proposta",
    probability: 60,
    assigneeName: "Lucas Mendes",
    ownerId: "usr-2",
    ownerName: "Lucas Mendes",
    companyId: "comp-horizonte",
    companyName: "Grupo Horizonte",
    contactId: "cnt-2",
    contactName: "Carlos Henrique",
    expectedCloseDate: "20/08/2026",
    status: "open",
    tags: ["Inbound", "Urgente"],
    source: "Google Ads",
    createdAt: "05/08/2026",
    updatedAt: "10/08/2026",
    lastActivityAt: "08/08/2026",
    lastActivityText: "Proposta comercial R$ 32k apresentada",
    nextTaskAt: "12/08/2026",
    nextTaskText: "Follow-up de aprovação com a diretoria",
    activities: [
      {
        id: "act-201-1",
        type: "meeting",
        title: "Apresentação da Proposta de Escopo",
        description: "Demonstração ao vivo da plataforma Nexus CRM.",
        authorName: "Lucas Mendes",
        createdAt: "08/08/2026 11:00",
      },
    ],
    tasks: [
      {
        id: "tsk-201-1",
        title: "Follow-up de aprovação com a diretoria",
        dueDate: "12/08/2026",
        dueTime: "10:00",
        assigneeName: "Lucas Mendes",
        completed: false,
        priority: "alta",
      },
    ],
    notes: [],
    stageHistory: [
      {
        id: "his-3",
        dealId: "deal-201",
        fromStageId: "stg-diag",
        fromStageName: "Diagnóstico",
        toStageId: "stg-prop",
        toStageName: "Proposta",
        changedBy: "Lucas Mendes",
        changedAt: "08/08/2026 12:00",
      },
    ],
  },
  {
    id: "deal-301",
    organizationId: "org-nexus-01",
    name: "Implantação Nexus ERP & CRM",
    value: 85000,
    formattedValue: "R$ 85.000",
    pipelineId: "pipe-b2b",
    pipelineName: "Vendas B2B Complexas",
    stageId: "stg-qual",
    stageName: "Qualificação",
    probability: 20,
    assigneeName: "Mariana Costa",
    ownerId: "usr-1",
    ownerName: "Mariana Costa",
    companyId: "comp-apex",
    companyName: "Apex Indústrias",
    contactId: "cnt-4",
    contactName: "Roberto Albuquerque",
    expectedCloseDate: "28/09/2026",
    status: "open",
    tags: ["Outbound"],
    source: "Prospecção Ativa",
    createdAt: "15/06/2026",
    updatedAt: "01/08/2026",
    lastActivityAt: "01/08/2026",
    lastActivityText: "Primeira chamada de qualificação realizada",
    nextTaskAt: "15/08/2026",
    nextTaskText: "Agendar reunião técnica de alinhamento",
    activities: [
      {
        id: "act-301-1",
        type: "call",
        title: "Call Inicial de Sondagem",
        description: "Apresentados cases de sucesso em indústrias.",
        authorName: "Mariana Costa",
        createdAt: "01/08/2026 09:30",
      },
    ],
    tasks: [],
    notes: [],
    stageHistory: [],
  },
  {
    id: "deal-401",
    organizationId: "org-nexus-01",
    name: "Plano Enterprise Multi-unidade",
    value: 120000,
    formattedValue: "R$ 120.000",
    pipelineId: "pipe-b2b",
    pipelineName: "Vendas B2B Complexas",
    stageId: "stg-close",
    stageName: "Fechamento",
    probability: 100,
    assigneeName: "Rafael Souza",
    ownerId: "usr-4",
    ownerName: "Rafael Souza",
    companyId: "comp-apex",
    companyName: "Apex Indústrias",
    contactId: "cnt-4",
    contactName: "Roberto Albuquerque",
    expectedCloseDate: "30/08/2026",
    status: "won",
    wonAt: "15/07/2026",
    tags: ["Ganha", "Key Account"],
    source: "Indicação Diretoria",
    createdAt: "15/07/2026",
    updatedAt: "15/07/2026",
    lastActivityAt: "15/07/2026",
    lastActivityText: "Contrato assinado via DocuSign",
    stageHistory: [
      {
        id: "his-4",
        dealId: "deal-401",
        fromStageId: "stg-neg",
        fromStageName: "Negociação",
        toStageId: "stg-close",
        toStageName: "Fechamento",
        changedBy: "Rafael Souza",
        changedAt: "15/07/2026 17:00",
      },
    ],
  },
  {
    id: "deal-402",
    organizationId: "org-nexus-01",
    name: "Licenciamento Módulo Obras",
    value: 28000,
    formattedValue: "R$ 28.000",
    pipelineId: "pipe-b2b",
    pipelineName: "Vendas B2B Complexas",
    stageId: "stg-neg",
    stageName: "Negociação",
    probability: 80,
    assigneeName: "Lucas Mendes",
    ownerId: "usr-2",
    ownerName: "Lucas Mendes",
    companyId: "comp-atlas",
    companyName: "Construtora Atlas",
    contactId: "cnt-5",
    contactName: "Juliana Menezes",
    expectedCloseDate: "25/08/2026",
    status: "open",
    tags: ["Construção"],
    source: "Evento Construtech",
    createdAt: "20/07/2026",
    updatedAt: "09/08/2026",
    lastActivityAt: "09/08/2026",
    lastActivityText: "Ajuste de cláusulas contratuais de SLA",
    nextTaskAt: "13/08/2026",
    nextTaskText: "Receber contrato assinado",
    activities: [
      {
        id: "act-402-1",
        type: "meeting",
        title: "Reunião de Alinhamento Jurídico",
        description: "Ajustados termos de garantia e SLA de atendimento.",
        authorName: "Lucas Mendes",
        createdAt: "09/08/2026 15:00",
      },
    ],
    tasks: [],
    notes: [],
    stageHistory: [
      {
        id: "his-5",
        dealId: "deal-402",
        fromStageId: "stg-prop",
        fromStageName: "Proposta",
        toStageId: "stg-neg",
        toStageName: "Negociação",
        changedBy: "Lucas Mendes",
        changedAt: "09/08/2026 15:30",
      },
    ],
  },
  {
    id: "deal-701",
    organizationId: "org-nexus-01",
    name: "Integração API Nexus & Vortex",
    value: 58000,
    formattedValue: "R$ 58.000",
    pipelineId: "pipe-b2b",
    pipelineName: "Vendas B2B Complexas",
    stageId: "stg-qual",
    stageName: "Qualificação",
    probability: 20,
    assigneeName: "Camila Rocha",
    ownerId: "usr-3",
    ownerName: "Camila Rocha",
    companyId: "comp-vortex",
    companyName: "Vortex Tech Labs",
    contactId: "cnt-7",
    contactName: "Beatriz Siqueira",
    expectedCloseDate: "05/09/2026",
    status: "open",
    tags: ["API", "Tech"],
    source: "Inbound Tech",
    createdAt: "09/08/2026",
    updatedAt: "10/08/2026",
    lastActivityAt: "10/08/2026",
    lastActivityText: "Envio do documento da API v3",
    activities: [],
    tasks: [],
    notes: [],
    stageHistory: [],
  },
];

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export const CRMDataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [contacts, setContacts] = useState<ContactItem[]>(
    MOCK_CONTACTS.map(({ tasks: _tasks, activities: _activities, ...contact }) => contact)
  );
  const [companies, setCompanies] = useState<CompanyItem[]>(
    MOCK_COMPANIES_DATA.map(({ tasks: _tasks, activities: _activities, ...company }) => company)
  );
  const [deals, setDeals] = useState<DealItem[]>(
    INITIAL_DEALS.map(({ tasks: _tasks, activities: _activities, ...deal }) => deal)
  );
  const [leads, setLeads] = useState<LeadItem[]>(
    MOCK_LEADS.map(({ tasks: _tasks, activities: _activities, ...lead }) => lead)
  );
  const [tasks, setTasks] = useState<TaskItem[]>(MOCK_TASKS_SEED);
  const [activities, setActivities] = useState<ActivityItem[]>(MOCK_ACTIVITIES_SEED);

  // --- LEAD HANDLERS ---
  const addLead = (leadData: Partial<LeadItem>): LeadItem => {
    const names = (leadData.name || "Novo Lead").trim().split(/\s+/);
    const newLead: LeadItem = {
      id: leadData.id || `lead-${Date.now()}`,
      organizationId: leadData.organizationId || "org-nexus-01",
      name: leadData.name || "Novo Lead",
      firstName: leadData.firstName || names[0],
      lastName: leadData.lastName || names.slice(1).join(" "),
      company: leadData.company || leadData.companyName || "",
      companyId: leadData.companyId,
      companyName: leadData.companyName || leadData.company,
      jobTitle: leadData.jobTitle || "",
      email: leadData.email || "",
      phone: leadData.phone || "",
      status: leadData.status || "new",
      source: leadData.source || "Site",
      ownerId: leadData.ownerId || "usr-1",
      ownerName: leadData.ownerName || "Mariana Costa",
      ownerAvatar: leadData.ownerAvatar,
      score: leadData.score ?? 65,
      tags: leadData.tags || [],
      createdAt: leadData.createdAt || "Hoje",
      updatedAt: leadData.updatedAt || "agora",
      lastActivityText: leadData.lastActivityText || "agora",
      nextTaskText: leadData.nextTaskText || "Nenhuma",
      ...leadData,
    };
    setLeads((prev) => [newLead, ...prev]);
    return newLead;
  };

  const updateLead = (id: string, updates: Partial<LeadItem>) => {
    setLeads((prev) => prev.map((lead) => lead.id === id ? { ...lead, ...updates, updatedAt: "agora" } : lead));
  };

  const archiveLead = (id: string) => {
    setLeads((prev) => prev.map((lead) => lead.id === id ? { ...lead, archivedAt: new Date().toISOString(), archived: true } : lead));
  };

  const bulkArchiveLeads = (ids: string[]) => {
    setLeads((prev) => prev.map((lead) => ids.includes(lead.id) ? { ...lead, archivedAt: new Date().toISOString(), archived: true } : lead));
  };

  const bulkUpdateLeadsOwner = (ids: string[], ownerId: string, ownerName: string, ownerAvatar?: string) => {
    setLeads((prev) => prev.map((lead) => ids.includes(lead.id) ? { ...lead, ownerId, ownerName, ownerAvatar, updatedAt: "agora" } : lead));
  };

  const bulkUpdateLeadsStatus = (ids: string[], status: LeadStatus) => {
    setLeads((prev) => prev.map((lead) => ids.includes(lead.id) ? { ...lead, status, updatedAt: "agora" } : lead));
  };

  const bulkAddLeadTag = (ids: string[], tag: string) => {
    setLeads((prev) => prev.map((lead) => ids.includes(lead.id) && !lead.tags.includes(tag) ? { ...lead, tags: [...lead.tags, tag], updatedAt: "agora" } : lead));
  };

  const bulkRemoveLeadTag = (ids: string[], tag: string) => {
    setLeads((prev) => prev.map((lead) => ids.includes(lead.id) ? { ...lead, tags: lead.tags.filter((item) => item !== tag), updatedAt: "agora" } : lead));
  };

  // --- CONTACTS HANDLERS ---
  const addContact = (contactData: Partial<ContactItem>): ContactItem => {
    const existingContact = contactData.email
      ? contacts.find((contact) => contact.email?.toLowerCase() === contactData.email?.toLowerCase())
      : undefined;
    if (existingContact) return existingContact;
    const fName = contactData.firstName || "";
    const lName = contactData.lastName || "";
    const computedFullName =
      contactData.fullName || `${fName} ${lName}`.trim() || "Novo Contato";

    const newContact: ContactItem = {
      id: contactData.id || `cnt-${Date.now()}`,
      organizationId: "org-nexus-01",
      firstName: fName,
      lastName: lName,
      fullName: computedFullName,
      email: contactData.email || "",
      phone: contactData.phone || "",
      jobTitle: contactData.jobTitle || "",
      companyId: contactData.companyId,
      companyName: contactData.companyName,
      ownerId: contactData.ownerId || "usr-1",
      ownerName: contactData.ownerName || "Mariana Costa",
      ownerAvatar: contactData.ownerAvatar,
      lifecycleStatus: contactData.lifecycleStatus || "active",
      source: contactData.source || "Manual",
      tags: contactData.tags || [],
      createdAt: new Date().toLocaleDateString("pt-BR"),
      updatedAt: "agora mesmo",
      lastActivityText: "Contato cadastrado no sistema",
      daysWithoutActivity: 0,
      ...contactData,
    };

    setContacts((prev) => [newContact, ...prev]);
    return newContact;
  };

  const updateContact = (id: string, updates: Partial<ContactItem>) => {
    setContacts((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const fName = updates.firstName ?? c.firstName;
        const lName = updates.lastName ?? c.lastName;
        const computedFullName =
          updates.fullName ?? `${fName} ${lName}`.trim() ?? c.fullName;
        return {
          ...c,
          ...updates,
          fullName: computedFullName,
          updatedAt: "agora mesmo",
        };
      })
    );
  };

  const archiveContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const bulkArchiveContacts = (ids: string[]) => {
    setContacts((prev) => prev.filter((c) => !ids.includes(c.id)));
  };

  const bulkUpdateContactsOwner = (
    ids: string[],
    ownerId: string,
    ownerName: string,
    ownerAvatar?: string
  ) => {
    setContacts((prev) =>
      prev.map((c) =>
        ids.includes(c.id)
          ? { ...c, ownerId, ownerName, ownerAvatar, updatedAt: "agora mesmo" }
          : c
      )
    );
  };

  const bulkUpdateContactsStatus = (
    ids: string[],
    status: ContactLifecycleStatus
  ) => {
    setContacts((prev) =>
      prev.map((c) =>
        ids.includes(c.id) ? { ...c, lifecycleStatus: status, updatedAt: "agora mesmo" } : c
      )
    );
  };

  const bulkAddContactTags = (ids: string[], tag: string) => {
    setContacts((prev) =>
      prev.map((c) =>
        ids.includes(c.id) && !c.tags.includes(tag)
          ? { ...c, tags: [...c.tags, tag], updatedAt: "agora mesmo" }
          : c
      )
    );
  };

  const bulkRemoveContactTags = (ids: string[], tag: string) => {
    setContacts((prev) =>
      prev.map((c) =>
        ids.includes(c.id)
          ? { ...c, tags: c.tags.filter((t) => t !== tag), updatedAt: "agora mesmo" }
          : c
      )
    );
  };

  // --- COMPANIES HANDLERS ---
  const addCompany = (companyData: Partial<CompanyItem>): CompanyItem => {
    const existingCompany = companyData.name
      ? companies.find((company) => company.name.toLowerCase() === companyData.name?.toLowerCase())
      : undefined;
    if (existingCompany) return existingCompany;
    const newCompany: CompanyItem = {
      id: companyData.id || `comp-${Date.now()}`,
      organizationId: "org-nexus-01",
      name: companyData.name || "Nova Empresa",
      legalName: companyData.legalName,
      cnpj: companyData.cnpj,
      domain: companyData.domain,
      phone: companyData.phone,
      email: companyData.email,
      segment: companyData.segment || "Tecnologia & SaaS",
      size: companyData.size || "Médio Porte",
      status: companyData.status || "prospect",
      ownerId: companyData.ownerId || "usr-1",
      ownerName: companyData.ownerName || "Mariana Costa",
      ownerAvatar: companyData.ownerAvatar,
      source: companyData.source || "Manual",
      tags: companyData.tags || [],
      address: companyData.address,
      customFields: companyData.customFields,
      createdAt: new Date().toLocaleDateString("pt-BR"),
      updatedAt: "agora mesmo",
      lastActivityText: "Empresa cadastrada no sistema",
      daysWithoutActivity: 0,
      ...companyData,
    };

    setCompanies((prev) => [newCompany, ...prev]);
    return newCompany;
  };

  const updateCompany = (id: string, updates: Partial<CompanyItem>) => {
    setCompanies((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, ...updates, updatedAt: "agora mesmo" } : c
      )
    );
  };

  const archiveCompany = (id: string) => {
    setCompanies((prev) => prev.filter((c) => c.id !== id));
  };

  const bulkArchiveCompanies = (ids: string[]) => {
    setCompanies((prev) => prev.filter((c) => !ids.includes(c.id)));
  };

  const bulkUpdateCompaniesOwner = (
    ids: string[],
    ownerId: string,
    ownerName: string,
    ownerAvatar?: string
  ) => {
    setCompanies((prev) =>
      prev.map((c) =>
        ids.includes(c.id)
          ? { ...c, ownerId, ownerName, ownerAvatar, updatedAt: "agora mesmo" }
          : c
      )
    );
  };

  const bulkUpdateCompaniesStatus = (ids: string[], status: CompanyStatus) => {
    setCompanies((prev) =>
      prev.map((c) =>
        ids.includes(c.id) ? { ...c, status, updatedAt: "agora mesmo" } : c
      )
    );
  };

  const bulkAddCompanyTags = (ids: string[], tag: string) => {
    setCompanies((prev) =>
      prev.map((c) =>
        ids.includes(c.id) && !c.tags.includes(tag)
          ? { ...c, tags: [...c.tags, tag], updatedAt: "agora mesmo" }
          : c
      )
    );
  };

  const bulkRemoveCompanyTags = (ids: string[], tag: string) => {
    setCompanies((prev) =>
      prev.map((c) =>
        ids.includes(c.id)
          ? { ...c, tags: c.tags.filter((t) => t !== tag), updatedAt: "agora mesmo" }
          : c
      )
    );
  };

  // --- DEALS HANDLERS ---
  const addDeal = (dealData: Partial<DealItem>): DealItem => {
    const { activities: _legacyActivities, tasks: _legacyTasks, ...cleanDealData } = dealData;
    const rawVal =
      typeof dealData.value === "number"
        ? dealData.value
        : parseFloat(String(dealData.value || 0).replace(/\D/g, "")) || 0;
    const formattedVal =
      dealData.formattedValue || `R$ ${rawVal.toLocaleString("pt-BR")}`;

    const newDeal: DealItem = {
      id: dealData.id || `deal-${Date.now()}`,
      organizationId: "org-nexus-01",
      name: dealData.name || "Novo Negócio",
      companyId: dealData.companyId,
      companyName: dealData.companyName,
      contactId: dealData.contactId,
      contactName: dealData.contactName,
      pipelineId: dealData.pipelineId || "pipe-b2b",
      pipelineName: dealData.pipelineName || "Vendas B2B Complexas",
      stageId: dealData.stageId || "stg-qual",
      stageName: dealData.stageName || "Qualificação",
      probability: dealData.probability ?? 20,
      value: rawVal,
      formattedValue: formattedVal,
      ownerId: dealData.ownerId || "usr-1",
      ownerName: dealData.ownerName || "Mariana Costa",
      assigneeName: dealData.assigneeName || dealData.ownerName || "Mariana Costa",
      expectedCloseDate: dealData.expectedCloseDate || "30/09/2026",
      status: dealData.status || "open",
      source: dealData.source || "Manual",
      tags: dealData.tags || [],
      products: dealData.products || [],
      notes: dealData.notes || [],
      stageHistory: dealData.stageHistory || [],
      customFields: dealData.customFields || [],
      createdAt: new Date().toLocaleDateString("pt-BR"),
      updatedAt: "agora mesmo",
      lastActivityAt: new Date().toLocaleDateString("pt-BR"),
      lastActivityText: "Negócio cadastrado no CRM",
      ...cleanDealData,
    };

    setDeals((prev) => [newDeal, ...prev]);
    setActivities((prev) => [
      {
        id: `act-init-${Date.now()}`,
        organizationId: "org-nexus-01",
        type: "note",
        title: "Negócio criado no CRM",
        description: "Oportunidade cadastrada no funil de vendas.",
        ownerId: newDeal.ownerId || "usr-1",
        ownerName: newDeal.ownerName || "Mariana Costa",
        startAt: new Date().toISOString(),
        status: "completed",
        entityType: "deal",
        entityId: newDeal.id,
        entityName: newDeal.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    return newDeal;
  };

  const updateDeal = (id: string, updates: Partial<DealItem>) => {
    setDeals((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;

        let newHistory = d.stageHistory || [];

        // Track stage or status transitions for automatic stageHistory recording
        const isStageChanged =
          updates.stageId &&
          (updates.stageId !== d.stageId || updates.stageName !== d.stageName);
        const isStatusChanged = updates.status && updates.status !== d.status;

        if ((isStageChanged || isStatusChanged) && !updates.stageHistory) {
          const nowFormatted = `${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
          let noteText: string | undefined = undefined;

          if (updates.status === "won") {
            noteText = "Negócio marcado como ganho";
          } else if (updates.status === "lost") {
            noteText = `Negócio marcado como perdido — ${updates.lossReason || d.lossReason || "Motivo não informado"}`;
          } else if (updates.status === "open" && d.status !== "open") {
            noteText = "Negócio reaberto no funil";
          }

          const historyEntry = {
            id: `his-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            dealId: id,
            fromStageId: d.stageId,
            fromStageName:
              d.status === "won"
                ? "Fechado / Ganho"
                : d.status === "lost"
                ? "Fechado / Perdido"
                : d.stageName,
            toStageId: updates.stageId || d.stageId || "stg-qual",
            toStageName:
              updates.status === "won"
                ? "Fechado / Ganho"
                : updates.status === "lost"
                ? "Fechado / Perdido"
                : updates.stageName || d.stageName,
            changedBy: updates.ownerName || d.ownerName || "Usuário",
            changedAt: nowFormatted,
            note: noteText,
          };
          newHistory = [historyEntry, ...newHistory];
        }

        // Recalculate formatted value if numeric value changes
        let newFormattedValue = updates.formattedValue || d.formattedValue;
        if (typeof updates.value === "number") {
          newFormattedValue = `R$ ${updates.value.toLocaleString("pt-BR")}`;
        }

        return {
          ...d,
          ...updates,
          formattedValue: newFormattedValue,
          stageHistory: updates.stageHistory || newHistory,
          updatedAt: "agora mesmo",
        };
      })
    );
  };

  const archiveDeal = (id: string) => {
    const timestamp = new Date().toISOString();
    setDeals((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, archivedAt: timestamp, isArchived: true, updatedAt: "agora mesmo" } : d
      )
    );
  };

  const bulkArchiveDeals = (ids: string[]) => {
    const timestamp = new Date().toISOString();
    setDeals((prev) =>
      prev.map((d) =>
        ids.includes(d.id)
          ? { ...d, archivedAt: timestamp, isArchived: true, updatedAt: "agora mesmo" }
          : d
      )
    );
  };

  // --- TASKS HANDLERS ---
  const addTask = (taskData: Partial<TaskItem>): TaskItem => {
    const newTask: TaskItem = {
      id: taskData.id || `tsk-${Date.now()}`,
      organizationId: taskData.organizationId || "org-nexus-01",
      title: taskData.title || "Nova Tarefa",
      description: taskData.description || "",
      status: taskData.status || "pending",
      priority: taskData.priority || "medium",
      ownerId: taskData.ownerId || "usr-1",
      ownerName: taskData.ownerName || "Mariana Costa",
      ownerAvatar: taskData.ownerAvatar,
      dueDate: taskData.dueDate || getLocalDateString(),
      dueTime: taskData.dueTime || "12:00",
      entityType: taskData.entityType,
      entityId: taskData.entityId,
      entityName: taskData.entityName,
      createdBy: taskData.createdBy || "Mariana Costa",
      createdAt: taskData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reminderAt: taskData.reminderAt,
      tags: taskData.tags || [],
      ...taskData,
    };

    setTasks((prev) => [newTask, ...prev]);
    return newTask;
  };

  const updateTask = (id: string, updates: Partial<TaskItem>) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
      )
    );
  };

  const completeTask = (id: string) => {
    const timestamp = new Date().toISOString();
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: "completed", completedAt: timestamp, updatedAt: timestamp }
          : t
      )
    );
  };

  const reopenTask = (id: string) => {
    const timestamp = new Date().toISOString();
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: "pending", completedAt: null, updatedAt: timestamp }
          : t
      )
    );
  };

  const archiveTask = (id: string) => {
    const timestamp = new Date().toISOString();
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, archivedAt: timestamp } : t))
    );
  };

  const bulkUpdateTasksOwner = (ids: string[], ownerId: string, ownerName: string) => {
    const timestamp = new Date().toISOString();
    setTasks((prev) =>
      prev.map((t) =>
        ids.includes(t.id) ? { ...t, ownerId, ownerName, updatedAt: timestamp } : t
      )
    );
  };

  const bulkUpdateTasksPriority = (ids: string[], priority: "low" | "medium" | "high") => {
    const timestamp = new Date().toISOString();
    setTasks((prev) =>
      prev.map((t) =>
        ids.includes(t.id) ? { ...t, priority, updatedAt: timestamp } : t
      )
    );
  };

  const bulkUpdateTasksDueDate = (ids: string[], dueDate: string) => {
    const timestamp = new Date().toISOString();
    setTasks((prev) =>
      prev.map((t) =>
        ids.includes(t.id) ? { ...t, dueDate, updatedAt: timestamp } : t
      )
    );
  };

  const bulkCompleteTasks = (ids: string[]) => {
    const timestamp = new Date().toISOString();
    setTasks((prev) =>
      prev.map((t) =>
        ids.includes(t.id)
          ? { ...t, status: "completed", completedAt: timestamp, updatedAt: timestamp }
          : t
      )
    );
  };

  const bulkReopenTasks = (ids: string[]) => {
    const timestamp = new Date().toISOString();
    setTasks((prev) =>
      prev.map((t) =>
        ids.includes(t.id)
          ? { ...t, status: "pending", completedAt: null, updatedAt: timestamp }
          : t
      )
    );
  };

  const bulkArchiveTasks = (ids: string[]) => {
    const timestamp = new Date().toISOString();
    setTasks((prev) =>
      prev.map((t) => (ids.includes(t.id) ? { ...t, archivedAt: timestamp } : t))
    );
  };

  // --- ACTIVITIES HANDLERS ---
  const addActivity = (activityData: Partial<ActivityItem>): ActivityItem => {
    const newActivity: ActivityItem = {
      id: activityData.id || `act-${Date.now()}`,
      organizationId: activityData.organizationId || "org-nexus-01",
      type: activityData.type || "call",
      title: activityData.title || "Nova Atividade",
      description: activityData.description || "",
      ownerId: activityData.ownerId || "usr-1",
      ownerName: activityData.ownerName || "Mariana Costa",
      ownerAvatar: activityData.ownerAvatar,
      startAt: activityData.startAt || new Date().toISOString(),
      endAt: activityData.endAt,
      allDay: activityData.allDay || false,
      entityType: activityData.entityType,
      entityId: activityData.entityId,
      entityName: activityData.entityName,
      location: activityData.location,
      meetingLink: activityData.meetingLink,
      status: activityData.status || "scheduled",
      createdAt: activityData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...activityData,
    };

    setActivities((prev) => [newActivity, ...prev]);

    const activityLabel = `${newActivity.title} (agora mesmo)`;
    if (newActivity.entityType === "contact" && newActivity.entityId) {
      setContacts((prev) =>
        prev.map((contact) =>
          contact.id === newActivity.entityId
            ? { ...contact, lastActivityText: activityLabel, daysWithoutActivity: 0, updatedAt: "agora mesmo" }
            : contact
        )
      );
    }
    if (newActivity.entityType === "company" && newActivity.entityId) {
      setCompanies((prev) =>
        prev.map((company) =>
          company.id === newActivity.entityId
            ? { ...company, lastActivityText: activityLabel, daysWithoutActivity: 0, updatedAt: "agora mesmo" }
            : company
        )
      );
    }
    if (newActivity.entityType === "deal" && newActivity.entityId) {
      setDeals((prev) =>
        prev.map((deal) =>
          deal.id === newActivity.entityId
            ? { ...deal, lastActivityAt: new Date().toLocaleDateString("pt-BR"), lastActivityText: newActivity.title, updatedAt: "agora mesmo" }
            : deal
        )
      );
    }
    return newActivity;
  };

  const updateActivity = (id: string, updates: Partial<ActivityItem>) => {
    setActivities((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
      )
    );
  };

  const completeActivity = (id: string) => {
    const timestamp = new Date().toISOString();
    setActivities((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: "completed", updatedAt: timestamp } : a
      )
    );
  };

  const cancelActivity = (id: string) => {
    const timestamp = new Date().toISOString();
    setActivities((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: "cancelled", updatedAt: timestamp } : a
      )
    );
  };

  const archiveActivity = (id: string) => {
    const timestamp = new Date().toISOString();
    setActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, archivedAt: timestamp } : a))
    );
  };

  // --- GETTERS ---
  const getCompanyDeals = (companyId: string): DealItem[] => {
    return deals.filter((d) => d.companyId === companyId && !d.archivedAt && !d.isArchived);
  };

  const getContactDeals = (contactId: string): DealItem[] => {
    return deals.filter((d) => d.contactId === contactId && !d.archivedAt && !d.isArchived);
  };

  const getEntityTasks = (entityType: string, entityId: string): TaskItem[] => {
    return tasks.filter(
      (t) =>
        !t.archivedAt &&
        t.entityType === entityType &&
        t.entityId === entityId
    );
  };

  const getEntityActivities = (entityType: string, entityId: string): ActivityItem[] => {
    return activities.filter(
      (a) =>
        !a.archivedAt &&
        a.entityType === entityType &&
        a.entityId === entityId
    );
  };

  const getUserTasks = (ownerId: string): TaskItem[] => {
    return tasks.filter((t) => !t.archivedAt && t.ownerId === ownerId);
  };

  const getUserActivities = (ownerId: string): ActivityItem[] => {
    return activities.filter((a) => !a.archivedAt && a.ownerId === ownerId);
  };

  const getCompanyContacts = (
    companyId?: string,
    companyName?: string
  ): ContactItem[] => {
    return contacts.filter((c) => {
      if (companyId && c.companyId === companyId) return true;
      if (
        companyName &&
        c.companyName &&
        c.companyName.toLowerCase().trim() === companyName.toLowerCase().trim()
      ) {
        return true;
      }
      return false;
    });
  };

  return (
    <CRMContext.Provider
      value={{
        leads,
        contacts,
        companies,
        deals,
        tasks,
        activities,
        addLead,
        updateLead,
        archiveLead,
        bulkArchiveLeads,
        bulkUpdateLeadsOwner,
        bulkUpdateLeadsStatus,
        bulkAddLeadTag,
        bulkRemoveLeadTag,
        addContact,
        updateContact,
        archiveContact,
        bulkArchiveContacts,
        bulkUpdateContactsOwner,
        bulkUpdateContactsStatus,
        bulkAddContactTags,
        bulkRemoveContactTags,
        setContacts,
        addCompany,
        updateCompany,
        archiveCompany,
        bulkArchiveCompanies,
        bulkUpdateCompaniesOwner,
        bulkUpdateCompaniesStatus,
        bulkAddCompanyTags,
        bulkRemoveCompanyTags,
        setCompanies,
        addDeal,
        updateDeal,
        archiveDeal,
        bulkArchiveDeals,
        setDeals,
        addTask,
        updateTask,
        completeTask,
        reopenTask,
        archiveTask,
        bulkUpdateTasksOwner,
        bulkUpdateTasksPriority,
        bulkUpdateTasksDueDate,
        bulkCompleteTasks,
        bulkReopenTasks,
        bulkArchiveTasks,
        addActivity,
        updateActivity,
        completeActivity,
        cancelActivity,
        archiveActivity,
        getCompanyDeals,
        getContactDeals,
        getCompanyContacts,
        getEntityTasks,
        getEntityActivities,
        getUserTasks,
        getUserActivities,
      }}
    >
      {children}
    </CRMContext.Provider>
  );
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error("useCRM must be used within a CRMDataProvider");
  }
  return context;
};
