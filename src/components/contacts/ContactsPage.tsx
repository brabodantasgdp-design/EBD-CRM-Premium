import React, { useState, useMemo } from "react";
import { ContactItem, ContactSummaryMetrics, ContactLifecycleStatus, PeriodOption, UIStateMode } from "../../types/crm";
import { MOCK_CONTACT_TAGS, MOCK_OWNERS } from "../../data/mockContactsData";
import { useCRM } from "../../context/CRMContext";
import { getLocalDateString } from "../../utils/formatters";
import { ContactsHeader } from "./ContactsHeader";
import { ContactMetrics } from "./ContactMetrics";
import { ContactFilters, ContactFilterState } from "./ContactFilters";
import { ContactTable } from "./ContactTable";
import { ContactCard } from "./ContactCard";
import { ContactBulkActions } from "./ContactBulkActions";
import { ContactFormModal } from "./ContactFormModal";
import { ContactDetailDrawer } from "./ContactDetailDrawer";
import { CompanyQuickModal } from "./CompanyQuickModal";
import { ContactImportModal } from "./ContactImportModal";
import { ContactExportMenu } from "./ContactExportMenu";
import { SkeletonDashboard } from "../states/SkeletonDashboard";
import { PermissionState } from "../states/PermissionState";
import { ErrorDashboardState } from "../states/ErrorDashboardState";
import { Users, Search, RotateCcw, Plus, AlertCircle, RefreshCw } from "lucide-react";

/**
 * Helper para verificar se um contato foi criado dentro do período selecionado (PeriodOption)
 * Base de referência do protótipo: 11/08/2026 (ou data atual)
 */
const isCreatedInPeriod = (createdAtStr: string | undefined, period: PeriodOption): boolean => {
  if (!createdAtStr) return false;

  const lower = createdAtStr.toLowerCase().trim();
  const isTodayStr =
    lower.includes("hoje") || lower.includes("agora") || lower.includes("11/08/2026");

  const refYear = 2026;
  const refMonth = 7; // Agosto (0-indexed: 7)
  const refDay = 11;
  const refDate = new Date(refYear, refMonth, refDay);

  let createdDate: Date | null = null;

  if (isTodayStr) {
    createdDate = new Date(refYear, refMonth, refDay);
  } else if (createdAtStr.includes("/")) {
    const parts = createdAtStr.split("/");
    if (parts.length >= 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // 0-indexed
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        createdDate = new Date(year, month, day);
      }
    }
  } else {
    const parsed = new Date(createdAtStr);
    if (!isNaN(parsed.getTime())) {
      createdDate = parsed;
    }
  }

  if (!createdDate) return false;

  switch (period) {
    case "hoje":
      return (
        isTodayStr ||
        (createdDate.getDate() === refDay &&
          createdDate.getMonth() === refMonth &&
          createdDate.getFullYear() === refYear)
      );

    case "7dias": {
      const diffMs = refDate.getTime() - createdDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 7;
    }

    case "30dias": {
      const diffMs = refDate.getTime() - createdDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 30;
    }

    case "este_mes": {
      return (
        createdDate.getMonth() === refMonth &&
        createdDate.getFullYear() === refYear
      );
    }

    case "trimestre": {
      // Q3 2026 (Julho, Agosto, Setembro = Meses 6, 7, 8)
      const q3Months = [6, 7, 8];
      return (
        q3Months.includes(createdDate.getMonth()) &&
        createdDate.getFullYear() === refYear
      );
    }

    case "personalizado":
    default:
      return true;
  }
};

interface ContactsPageProps {
  onShowToast: (msg: string) => void;
  currentPeriod: PeriodOption;
}

export const ContactsPage: React.FC<ContactsPageProps> = ({
  onShowToast,
  currentPeriod,
}) => {
  const {
    contacts: rawContacts,
    addContact,
    updateContact,
    archiveContact,
    bulkArchiveContacts,
    bulkUpdateContactsOwner,
    bulkUpdateContactsStatus,
    bulkAddContactTags,
    bulkRemoveContactTags,
    deals,
    addTask,
    getEntityTasks,
  } = useCRM();

  // Contacts enriched with their live linked deals from global deals
  const contacts = useMemo(() => {
    return rawContacts.map((cnt) => ({
      ...cnt,
      deals: deals.filter((d) => d.contactId === cnt.id),
    }));
  }, [rawContacts, deals]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [uiState, setUiState] = useState<UIStateMode>("normal");

  // Filters State
  const [filters, setFilters] = useState<ContactFilterState>({
    search: "",
    status: "all",
    company: "all",
    ownerId: "all",
    tag: "all",
    hasOpenDeals: "all",
    hasPendingTask: "all",
    noRecentActivity: "all",
    sortBy: "recent",
  });

  // Modal / Drawer States
  const [drawerContact, setDrawerContact] = useState<ContactItem | null>(null);
  const [formModalState, setFormModalState] = useState<{
    open: boolean;
    contact?: ContactItem | null;
  }>({ open: false });

  const [companyQuickModalState, setCompanyQuickModalState] = useState<{
    open: boolean;
    companyName: string;
    companyData?: ContactItem["companyData"];
  }>({ open: false, companyName: "" });

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  // Available unique lists for filter dropdowns
  const availableCompanies = useMemo(() => {
    const list = contacts
      .map((c) => c.companyName)
      .filter((c): c is string => !!c && c.trim() !== "");
    return Array.from(new Set(list));
  }, [contacts]);

  const availableTags = MOCK_CONTACT_TAGS;
  const availableOwners = MOCK_OWNERS;

  // Filtered & Sorted Contacts List
  const filteredContacts = useMemo(() => {
    return contacts
      .filter((c) => {
        // Exclude archived by default unless specifically selected
        if (c.archivedAt) return false;

        // Search Filter
        if (filters.search.trim()) {
          const q = filters.search.toLowerCase().trim();
          const matchName = c.fullName.toLowerCase().includes(q);
          const matchCompany = (c.companyName || "").toLowerCase().includes(q);
          const matchEmail = (c.email || "").toLowerCase().includes(q);
          const matchPhone = (c.phone || c.mobilePhone || "").includes(q);
          if (!matchName && !matchCompany && !matchEmail && !matchPhone) return false;
        }

        // Status Filter
        if (filters.status !== "all" && c.lifecycleStatus !== filters.status) {
          return false;
        }

        // Company Filter
        if (filters.company !== "all" && c.companyName !== filters.company) {
          return false;
        }

        // Owner Filter
        if (filters.ownerId !== "all" && c.ownerId !== filters.ownerId) {
          return false;
        }

        // Tag Filter
        if (filters.tag !== "all" && !c.tags.includes(filters.tag)) {
          return false;
        }

        // Open Deals Filter
        const hasOpenDeals = c.deals && c.deals.some((d) => d.status === "open");
        if (filters.hasOpenDeals === "yes" && !hasOpenDeals) return false;
        if (filters.hasOpenDeals === "no" && hasOpenDeals) return false;

        // Pending Tasks Filter
        const hasPendingTask = getEntityTasks("contact", c.id).some((t) => t.status === "pending");
        if (filters.hasPendingTask === "yes" && !hasPendingTask) return false;
        if (filters.hasPendingTask === "no" && hasPendingTask) return false;

        // Inactivity Filter (>30 days)
        const isInactive = (c.daysWithoutActivity ?? 0) > 30;
        if (filters.noRecentActivity === "yes" && !isInactive) return false;
        if (filters.noRecentActivity === "no" && isInactive) return false;

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === "name_asc") {
          return a.fullName.localeCompare(b.fullName);
        }
        if (filters.sortBy === "name_desc") {
          return b.fullName.localeCompare(a.fullName);
        }
        if (filters.sortBy === "oldest") {
          return a.createdAt.localeCompare(b.createdAt);
        }
        if (filters.sortBy === "most_deals") {
          const countA = a.deals?.length || 0;
          const countB = b.deals?.length || 0;
          return countB - countA;
        }
        if (filters.sortBy === "last_activity") {
          return (a.daysWithoutActivity ?? 99) - (b.daysWithoutActivity ?? 99);
        }
        // default: "recent"
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [contacts, filters]);

  // Derived Summary Metrics
  const summaryMetrics: ContactSummaryMetrics = useMemo(() => {
    const activeList = contacts.filter((c) => !c.archivedAt);
    return {
      totalContacts: activeList.length,
      activeContacts: activeList.filter(
        (c) => c.lifecycleStatus === "active" || c.lifecycleStatus === "customer"
      ).length,
      customers: activeList.filter((c) => c.lifecycleStatus === "customer").length,
      newInPeriod: activeList.filter((c) => isCreatedInPeriod(c.createdAt, currentPeriod)).length,
      withOpenDeals: activeList.filter((c) => c.deals && c.deals.some((d) => d.status === "open"))
        .length,
      withoutRecentActivity: activeList.filter((c) => (c.daysWithoutActivity ?? 0) > 30).length,
    };
  }, [contacts, currentPeriod]);

  // Selection Handlers
  const handleSelectToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAllToggle = () => {
    const visibleIds = filteredContacts.map((c) => c.id);
    const allSelected = visibleIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(selectedIds.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds(Array.from(new Set([...selectedIds, ...visibleIds])));
    }
  };

  // Single Contact Action Handlers
  const handleSaveContact = (contactPayload: Partial<ContactItem>) => {
    if (formModalState.contact) {
      // Edit
      updateContact(formModalState.contact.id, contactPayload);
      onShowToast("Contato atualizado com sucesso!");
    } else {
      // New
      addContact(contactPayload);
      onShowToast("Novo contato cadastrado com sucesso!");
    }

    setFormModalState({ open: false });
  };

  const handleArchiveContact = (contact: ContactItem) => {
    archiveContact(contact.id);
    if (drawerContact?.id === contact.id) setDrawerContact(null);
    onShowToast(`Contato ${contact.fullName} arquivado com sucesso.`);
  };

  // Bulk Operations
  const handleBulkChangeOwner = (newOwnerId: string, ownerName: string) => {
    const selectedOwner = availableOwners.find((o) => o.id === newOwnerId);
    bulkUpdateContactsOwner(selectedIds, newOwnerId, ownerName, selectedOwner?.avatar);
    setSelectedIds([]);
    onShowToast(`Responsável de ${selectedIds.length} contato(s) alterado para ${ownerName}.`);
  };

  const handleBulkChangeStatus = (newStatus: ContactLifecycleStatus) => {
    bulkUpdateContactsStatus(selectedIds, newStatus);
    setSelectedIds([]);
    onShowToast(`Status de ${selectedIds.length} contato(s) atualizado para ${newStatus}.`);
  };

  const handleBulkAddTag = (tag: string) => {
    bulkAddContactTags(selectedIds, tag);
    setSelectedIds([]);
    onShowToast(`Tag "${tag}" adicionada a ${selectedIds.length} contato(s).`);
  };

  const handleBulkRemoveTag = (tag: string) => {
    bulkRemoveContactTags(selectedIds, tag);
    setSelectedIds([]);
    onShowToast(`Tag "${tag}" removida de ${selectedIds.length} contato(s).`);
  };

  const handleBulkCreateTask = () => {
    selectedIds.forEach((id) => {
      const c = contacts.find((item) => item.id === id);
      if (c) {
        addTask({
          title: "Acompanhamento geral de relacionamento",
          dueDate: getLocalDateString(new Date(Date.now() + 86400000)),
          ownerId: c.ownerId,
          ownerName: c.ownerName,
          priority: "high",
          entityType: "contact",
          entityId: c.id,
          entityName: c.fullName,
        });
      }
    });
    setSelectedIds([]);
    onShowToast(`Tarefa agendada para ${selectedIds.length} contato(s)!`);
  };

  const handleBulkArchive = () => {
    bulkArchiveContacts(selectedIds);
    setSelectedIds([]);
    onShowToast(`${selectedIds.length} contato(s) arquivado(s) com sucesso.`);
  };

  // Selected Items for Export
  const selectedContacts = useMemo(() => {
    return contacts.filter((c) => selectedIds.includes(c.id));
  }, [contacts, selectedIds]);

  return (
    <div className="space-y-5 sm:space-y-6 min-w-0 pb-16 lg:pb-0">
      {/* Header */}
      <ContactsHeader
        onOpenNewContact={() => setFormModalState({ open: true, contact: null })}
        onOpenImport={() => setImportModalOpen(true)}
        onOpenExport={() => setExportMenuOpen(true)}
        selectedCount={selectedIds.length}
      />

      {/* UI State Conditions */}
      {uiState === "loading" && <SkeletonDashboard />}
      {uiState === "no_permission" && <PermissionState />}
      {uiState === "error" && (
        <ErrorDashboardState onRetry={() => setUiState("normal")} />
      )}

      {uiState === "normal" && (
        <>
          {/* KPI Strip */}
          <section aria-label="Métricas de Contatos">
            <ContactMetrics metrics={summaryMetrics} />
          </section>

          {/* Filters & Search */}
          <section aria-label="Filtros de Contatos">
            <ContactFilters
              filters={filters}
              onFilterChange={setFilters}
              availableCompanies={availableCompanies}
              availableOwners={availableOwners}
              availableTags={availableTags}
              totalResults={filteredContacts.length}
            />
          </section>

          {/* Content Listing Views */}
          {filteredContacts.length > 0 ? (
            <section aria-label="Lista de Contatos" className="space-y-4">
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <ContactTable
                  contacts={filteredContacts}
                  selectedIds={selectedIds}
                  onSelectToggle={handleSelectToggle}
                  onSelectAllToggle={handleSelectAllToggle}
                  onViewContact={(c) => setDrawerContact(c)}
                  onEditContact={(c) => setFormModalState({ open: true, contact: c })}
                  onArchiveContact={handleArchiveContact}
                  onQuickTask={(c) => setDrawerContact(c)}
                  onQuickActivity={(c) => setDrawerContact(c)}
                  onOpenCompanyQuickView={(name, data) =>
                    setCompanyQuickModalState({ open: true, companyName: name, companyData: data })
                  }
                />
              </div>

              {/* Mobile Cards View */}
              <div className="grid grid-cols-1 md:hidden gap-3">
                {filteredContacts.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    isSelected={selectedIds.includes(contact.id)}
                    onSelectToggle={handleSelectToggle}
                    onViewContact={(c) => setDrawerContact(c)}
                    onEditContact={(c) => setFormModalState({ open: true, contact: c })}
                    onArchiveContact={handleArchiveContact}
                    onQuickTask={(c) => setDrawerContact(c)}
                    onQuickActivity={(c) => setDrawerContact(c)}
                    onOpenCompanyQuickView={(name, data) =>
                      setCompanyQuickModalState({ open: true, companyName: name, companyData: data })
                    }
                  />
                ))}
              </div>
            </section>
          ) : (
            /* Empty / No Search Results States */
            <div className="p-8 sm:p-12 text-center bg-white border border-slate-200 rounded-3xl shadow-2xs space-y-3 my-4">
              {contacts.length === 0 ? (
                <>
                  <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center mx-auto">
                    <Users className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Nenhum contato cadastrado no CRM
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Centralize relacionamentos e histórico comercial criando seu primeiro registro.
                  </p>
                  <button
                    onClick={() => setFormModalState({ open: true, contact: null })}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md inline-flex items-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Adicionar Primeiro Contato</span>
                  </button>
                </>
              ) : (
                <>
                  <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-500 border border-slate-200 flex items-center justify-center mx-auto">
                    <Search className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Nenhum contato encontrado para esta busca
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Tente ajustar o termo pesquisado ou remover os filtros aplicados.
                  </p>
                  <button
                    onClick={() =>
                      setFilters({
                        search: "",
                        status: "all",
                        company: "all",
                        ownerId: "all",
                        tag: "all",
                        hasOpenDeals: "all",
                        hasPendingTask: "all",
                        noRecentActivity: "all",
                        sortBy: "recent",
                      })
                    }
                    className="px-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 inline-flex items-center gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Limpar Busca e Filtros</span>
                  </button>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Floating Bulk Actions Bar */}
      <ContactBulkActions
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onChangeOwner={handleBulkChangeOwner}
        onChangeStatus={handleBulkChangeStatus}
        onAddTag={handleBulkAddTag}
        onRemoveTag={handleBulkRemoveTag}
        onCreateTask={handleBulkCreateTask}
        onExportSelected={() => setExportMenuOpen(true)}
        onArchiveSelected={handleBulkArchive}
        availableOwners={availableOwners}
        availableTags={availableTags}
      />

      {/* 360° Contact Detail Drawer */}
      {drawerContact && (
        <ContactDetailDrawer
          contact={drawerContact}
          onClose={() => setDrawerContact(null)}
          onEditContact={(c) => {
            setDrawerContact(null);
            setFormModalState({ open: true, contact: c });
          }}
          onUpdateContact={(updated) => {
            updateContact(updated.id, updated);
            setDrawerContact(updated);
          }}
          onOpenCompanyQuickView={(name, data) =>
            setCompanyQuickModalState({ open: true, companyName: name, companyData: data })
          }
          onShowToast={onShowToast}
        />
      )}

      {/* Contact Form Modal (New / Edit) */}
      {formModalState.open && (
        <ContactFormModal
          initialContact={formModalState.contact}
          existingContacts={contacts}
          availableOwners={availableOwners}
          availableTags={availableTags}
          onClose={() => setFormModalState({ open: false })}
          onSave={handleSaveContact}
          onViewExisting={(existing) => setDrawerContact(existing)}
        />
      )}

      {/* Company Quick View Modal */}
      {companyQuickModalState.open && (
        <CompanyQuickModal
          companyName={companyQuickModalState.companyName}
          companyData={companyQuickModalState.companyData}
          onClose={() => setCompanyQuickModalState({ ...companyQuickModalState, open: false })}
        />
      )}

      {/* CSV Import Modal */}
      {importModalOpen && (
        <ContactImportModal
          onClose={() => setImportModalOpen(false)}
          onImportSuccess={(newContacts) => {
            newContacts.forEach((nc) => addContact(nc));
          }}
          onShowToast={onShowToast}
          availableOwners={availableOwners}
        />
      )}

      {/* CSV Export Menu */}
      {exportMenuOpen && (
        <ContactExportMenu
          contacts={contacts}
          filteredContacts={filteredContacts}
          selectedContacts={selectedContacts}
          onClose={() => setExportMenuOpen(false)}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
};
