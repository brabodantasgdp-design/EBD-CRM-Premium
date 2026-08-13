export type PeriodOption = "hoje" | "7dias" | "30dias" | "este_mes" | "trimestre" | "personalizado";

import type { Dispatch, SetStateAction } from "react";

export type UIStateMode = "normal" | "loading" | "empty" | "error" | "no_permission";

export interface DashboardMetric {
  id: string;
  label: string;
  value: string;
  numericValue: number;
  trend?: number; // percentage change
  trendType?: "positive" | "negative" | "neutral";
  comparison?: string;
  secondaryText?: string;
  tooltipText: string;
  iconName: string;
}

export interface RevenueDataPoint {
  periodLabel: string;
  receita: number;
  receitaAnterior: number;
  negocios: number;
  negociosAnterior: number;
}

export interface PipelineStage {
  id: string;
  name: string;
  dealsCount: number;
  totalValue: number;
  conversionRatePercent: number;
  color: string;
}

export interface ForecastData {
  monthlyGoal: number;
  closedValue: number;
  probableValue: number;
  remainingGoal: number;
  closedPercent: number;
  probablePercent: number;
}

export interface CRMTask {
  id: string;
  time: string;
  type: "Ligação" | "Reunião" | "Follow-up" | "Demo comercial" | "Proposta";
  companyName: string;
  assigneeName: string;
  assigneeAvatar?: string;
  status: "pendente" | "concluida" | "atrasada";
  isMine: boolean;
  priority: "alta" | "media" | "baixa";
}

export interface RiskDeal {
  id: string;
  companyName: string;
  value: number;
  formattedValue: string;
  stage: string;
  reason: string;
  daysWithoutInteraction: number;
  assigneeName: string;
  riskLevel: "alto" | "medio" | "baixo";
}

export interface SalesRepPerformance {
  id: string;
  name: string;
  avatar: string;
  role: string;
  revenue: number;
  formattedRevenue: string;
  wonDeals: number;
  conversionRatePercent: number;
  metaProgressPercent: number;
  rank: number;
}

export interface LeadMetrics {
  totalNewLeads: number;
  growthPercent: number;
  qualifiedCount: number;
  qualificationRatePercent: number;
  weeklyTrend: number[];
}

export interface LeadSource {
  name: string;
  percentage: number;
  count: number;
  color: string;
}

export interface ActivityFeedItem {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  action: string;
  target: string;
  timestamp: string;
  type: "deal_moved" | "call_logged" | "deal_won" | "proposal_added" | "lead_created";
}

export interface CopilotInsight {
  id: string;
  text: string;
  badgeText: string;
  suggestions: {
    id: string;
    label: string;
    actionType: "filter_risk" | "analyze_pipeline" | "prepare_followups";
  }[];
}

export interface CompanyAccount {
  id: string;
  name: string;
  plan: string;
  logoUrl?: string;
  active: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatar: string;
  companyName: string;
}

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "nurturing"
  | "converted"
  | "disqualified";

export type LeadSourceType =
  | "Indicação"
  | "Site"
  | "LinkedIn"
  | "Prospecção"
  | "Evento"
  | "Formulário"
  | "Outro";

export type DisqualificationReason =
  | "Sem fit"
  | "Sem orçamento"
  | "Sem interesse"
  | "Dados inválidos"
  | "Duplicado"
  | "Concorrente"
  | "Outro";

export interface LeadActivity {
  id: string;
  type: "call" | "meeting" | "email" | "note" | "status_change" | "system";
  title: string;
  description: string;
  authorName: string;
  createdAt: string;
}

export interface LeadTaskItem {
  id: string;
  title: string;
  dueDate: string;
  dueTime?: string;
  assigneeName: string;
  completed: boolean;
  priority: "alta" | "media" | "baixa";
}

export interface LeadCustomField {
  label: string;
  value: string;
}

export type ContactLifecycleStatus =
  | "active"
  | "inactive"
  | "customer"
  | "former_customer";

export interface ContactActivity {
  id: string;
  type: "call" | "meeting" | "email" | "note" | "followup";
  title: string;
  description: string;
  authorName: string;
  createdAt: string;
  relatedDealName?: string;
}

export interface ContactTask {
  id: string;
  title: string;
  dueDate: string;
  dueTime?: string;
  assigneeName: string;
  completed: boolean;
  priority: "alta" | "media" | "baixa";
  relatedDealName?: string;
}

export interface ContactNote {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface DealStageHistory {
  id: string;
  dealId: string;
  fromStageId?: string;
  fromStageName?: string;
  toStageId: string;
  toStageName: string;
  changedBy: string;
  changedAt: string;
  note?: string;
}

export interface DealProduct {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
}

export interface DealActivity {
  id: string;
  type: "call" | "meeting" | "email" | "followup" | "note";
  title: string;
  description: string;
  authorName: string;
  createdAt: string;
}

export interface DealTask {
  id: string;
  title: string;
  dueDate: string;
  dueTime?: string;
  assigneeName: string;
  completed: boolean;
  priority: "alta" | "media" | "baixa";
}

export interface DealNote {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface DealCustomField {
  label: string;
  value: string;
}

export interface DealItem {
  id: string;
  organizationId?: string;
  name: string;
  companyId?: string;
  companyName?: string;
  contactId?: string;
  contactName?: string;
  pipelineId?: string;
  pipelineName: string;
  stageId?: string;
  stageName: string;
  value: number;
  formattedValue?: string;
  probability?: number;
  ownerId?: string;
  ownerName?: string;
  ownerAvatar?: string;
  assigneeName?: string;
  expectedCloseDate: string;
  status: "open" | "won" | "lost";
  lossReason?: string;
  lossNote?: string;
  lostAt?: string;
  wonAt?: string;
  archivedAt?: string | null;
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastActivityAt?: string;
  lastActivityText?: string;
  nextTaskAt?: string;
  nextTaskText?: string;
  source?: string;
  tags?: string[];
  /** @deprecated Use CRMContext.activities filtered by entityType/entityId. */
  activities?: DealActivity[];
  /** @deprecated Use CRMContext.tasks filtered by entityType/entityId. */
  tasks?: DealTask[];
  products?: DealProduct[];
  notes?: DealNote[];
  stageHistory?: DealStageHistory[];
  customFields?: DealCustomField[];
}

export interface PipelineStageEntity {
  id: string;
  pipelineId: string;
  name: string;
  position: number;
  probability: number;
  color?: string;
  stageType: "open" | "won" | "lost";
}

export interface PipelineEntity {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  status: "active" | "archived";
  isDefault: boolean;
  position: number;
  stages: PipelineStageEntity[];
}

export type ContactDeal = DealItem;

export interface ContactCompany {
  id: string;
  name: string;
  segment: string;
  size: string;
  openDealsCount: number;
}

export type CompanyStatus = "prospect" | "cliente" | "inativo" | "ex_cliente";

export interface CompanyActivity {
  id: string;
  type: "call" | "meeting" | "email" | "note" | "followup";
  title: string;
  description: string;
  authorName: string;
  createdAt: string;
  relatedDealName?: string;
  relatedContactName?: string;
}

export interface CompanyTask {
  id: string;
  title: string;
  dueDate: string;
  dueTime?: string;
  assigneeName: string;
  completed: boolean;
  priority: "alta" | "media" | "baixa";
  relatedDealName?: string;
  relatedContactName?: string;
}

export interface CompanyNote {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface CompanyCustomField {
  label: string;
  value: string;
}

export interface CompanyAddress {
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface CompanyItem {
  id: string;
  organizationId: string; // Multi-tenant internal ID
  name: string; // Nome Fantasia
  legalName?: string; // Razão Social
  cnpj?: string;
  domain?: string; // Site
  phone?: string;
  email?: string; // E-mail corporativo
  segment: string;
  size: string; // Porte
  employeeCount?: string | number;
  estimatedRevenue?: string;
  status: CompanyStatus;
  ownerId: string;
  ownerName: string;
  ownerAvatar?: string;
  source?: string;
  tags: string[];
  address?: CompanyAddress;
  customFields?: CompanyCustomField[];
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
  lastActivityText?: string;
  lastActivityDate?: string;
  daysWithoutActivity?: number;
  nextTaskText?: string;
  nextTaskDate?: string;
  contacts?: ContactItem[];
  deals?: ContactDeal[];
  /** @deprecated Use CRMContext.activities filtered by entityType/entityId. */
  activities?: CompanyActivity[];
  /** @deprecated Use CRMContext.tasks filtered by entityType/entityId. */
  tasks?: CompanyTask[];
  notesList?: CompanyNote[];
}

export interface CompanySummaryMetrics {
  totalCompanies: number;
  customers: number;
  prospects: number;
  withOpenDeals: number;
  withoutActivity: number;
  totalPipelineValue: number;
  formattedPipelineValue: string;
}

export interface ContactCustomField {
  label: string;
  value: string;
}

export interface ContactItem {
  id: string;
  organizationId: string; // Multi-tenant internal ID
  firstName: string;
  lastName?: string;
  fullName: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  jobTitle?: string;
  companyId?: string;
  companyName?: string;
  companyData?: ContactCompany;
  ownerId: string;
  ownerName: string;
  ownerAvatar?: string;
  lifecycleStatus: ContactLifecycleStatus;
  source?: string;
  tags: string[];
  notesList?: ContactNote[];
  customFields?: ContactCustomField[];
  convertedFromLeadId?: string;
  convertedFromLeadDate?: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
  lastActivityText?: string;
  daysWithoutActivity?: number;
  deals?: ContactDeal[];
  /** @deprecated Use CRMContext.activities filtered by entityType/entityId. */
  activities?: ContactActivity[];
  /** @deprecated Use CRMContext.tasks filtered by entityType/entityId. */
  tasks?: ContactTask[];
}

export interface ContactSummaryMetrics {
  totalContacts: number;
  activeContacts: number;
  customers: number;
  newInPeriod: number;
  withOpenDeals: number;
  withoutRecentActivity: number;
}

export interface LeadItem {
  id: string;
  organizationId?: string; // Documentação Multi-tenant / RLS
  name: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  companyId?: string;
  companyName?: string;
  jobTitle?: string;
  email?: string;
  phone?: string;
  status: LeadStatus;
  source: LeadSourceType;
  ownerId: string;
  ownerName: string;
  ownerAvatar?: string;
  score: number; // 0 - 100
  tags: string[];
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
  convertedAt?: string;
  convertedContactId?: string;
  convertedCompanyId?: string;
  convertedDealId?: string;
  lastActivityText: string;
  nextTaskText?: string;
  archived?: boolean;
  disqualificationReason?: DisqualificationReason;
  disqualificationNote?: string;
  customFields?: LeadCustomField[];
  /** @deprecated Use CRMContext.activities filtered by entityType/entityId. */
  activities?: LeadActivity[];
  /** @deprecated Use CRMContext.tasks filtered by entityType/entityId. */
  tasks?: LeadTaskItem[];
  convertedDetails?: {
    contactName: string;
    companyName: string;
    dealName: string;
    pipelineName: string;
    stageName: string;
    estimatedValue: number;
    convertedAt: string;
  };
}

export interface TaskItem {
  id: string;
  organizationId: string;
  title: string;
  description?: string;
  status: "pending" | "completed";
  priority: "low" | "medium" | "high";
  ownerId: string;
  ownerName: string;
  ownerAvatar?: string;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  entityType?: "lead" | "contact" | "company" | "deal";
  entityId?: string;
  entityName?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  archivedAt?: string | null;
  reminderAt?: string | null;
  tags?: string[];
}

export interface ActivityItem {
  id: string;
  organizationId: string;
  type: "call" | "meeting" | "email" | "follow_up" | "note";
  title: string;
  description?: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar?: string;
  startAt: string; // ISO format string
  endAt?: string;
  allDay?: boolean;
  entityType?: "lead" | "contact" | "company" | "deal";
  entityId?: string;
  entityName?: string;
  location?: string;
  meetingLink?: string;
  status: "scheduled" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
}

export interface CRMContextType {
  leads: LeadItem[];
  contacts: ContactItem[];
  companies: CompanyItem[];
  deals: DealItem[];
  pipelines: PipelineEntity[];
  tasks: TaskItem[];
  activities: ActivityItem[];

  addLead: (lead: Partial<LeadItem>) => LeadItem;
  updateLead: (id: string, updates: Partial<LeadItem>) => void;
  archiveLead: (id: string) => void;
  bulkArchiveLeads: (ids: string[]) => void;
  bulkUpdateLeadsOwner: (ids: string[], ownerId: string, ownerName: string, ownerAvatar?: string) => void;
  bulkUpdateLeadsStatus: (ids: string[], status: LeadStatus) => void;
  bulkAddLeadTag: (ids: string[], tag: string) => void;
  bulkRemoveLeadTag: (ids: string[], tag: string) => void;
  
  // Contact Actions
  addContact: (contact: Partial<ContactItem>) => ContactItem;
  updateContact: (id: string, updates: Partial<ContactItem>) => void;
  archiveContact: (id: string) => void;
  bulkArchiveContacts: (ids: string[]) => void;
  bulkUpdateContactsOwner: (ids: string[], ownerId: string, ownerName: string, ownerAvatar?: string) => void;
  bulkUpdateContactsStatus: (ids: string[], status: ContactLifecycleStatus) => void;
  bulkAddContactTags: (ids: string[], tag: string) => void;
  bulkRemoveContactTags: (ids: string[], tag: string) => void;
  setContacts: Dispatch<SetStateAction<ContactItem[]>>;
  
  // Company Actions
  addCompany: (company: Partial<CompanyItem>) => CompanyItem;
  updateCompany: (id: string, updates: Partial<CompanyItem>) => void;
  archiveCompany: (id: string) => void;
  bulkArchiveCompanies: (ids: string[]) => void;
  bulkUpdateCompaniesOwner: (ids: string[], ownerId: string, ownerName: string, ownerAvatar?: string) => void;
  bulkUpdateCompaniesStatus: (ids: string[], status: CompanyStatus) => void;
  bulkAddCompanyTags: (ids: string[], tag: string) => void;
  bulkRemoveCompanyTags: (ids: string[], tag: string) => void;
  setCompanies: Dispatch<SetStateAction<CompanyItem[]>>;
  
  // Deal Actions
  addDeal: (deal: Partial<DealItem>) => DealItem;
  updateDeal: (id: string, updates: Partial<DealItem>) => void;
  archiveDeal: (id: string) => void;
  bulkArchiveDeals: (ids: string[]) => void;
  moveDealStage: (id: string, pipelineId: string, stageId: string, note?: string) => void;
  markDealWon: (id: string) => void;
  markDealLost: (id: string, reason: string, note?: string) => void;
  reopenDeal: (id: string, pipelineId: string, stageId: string) => void;
  setDeals: Dispatch<SetStateAction<DealItem[]>>;

  // Task Actions
  addTask: (task: Partial<TaskItem>) => TaskItem;
  updateTask: (id: string, updates: Partial<TaskItem>) => void;
  completeTask: (id: string) => void;
  reopenTask: (id: string) => void;
  archiveTask: (id: string) => void;
  bulkUpdateTasksOwner: (ids: string[], ownerId: string, ownerName: string) => void;
  bulkUpdateTasksPriority: (ids: string[], priority: "low" | "medium" | "high") => void;
  bulkUpdateTasksDueDate: (ids: string[], dueDate: string) => void;
  bulkCompleteTasks: (ids: string[]) => void;
  bulkReopenTasks: (ids: string[]) => void;
  bulkArchiveTasks: (ids: string[]) => void;

  // Activity Actions
  addActivity: (activity: Partial<ActivityItem>) => ActivityItem;
  updateActivity: (id: string, updates: Partial<ActivityItem>) => void;
  completeActivity: (id: string) => void;
  cancelActivity: (id: string) => void;
  archiveActivity: (id: string) => void;

  // Getters
  getCompanyDeals: (companyId: string) => DealItem[];
  getContactDeals: (contactId: string) => DealItem[];
  getCompanyContacts: (companyId?: string, companyName?: string) => ContactItem[];
  getEntityTasks: (entityType: string, entityId: string) => TaskItem[];
  getEntityActivities: (entityType: string, entityId: string) => ActivityItem[];
  getUserTasks: (ownerId: string) => TaskItem[];
  getUserActivities: (ownerId: string) => ActivityItem[];
}
