import React, { useState, useMemo } from "react";
import {
  Building2,
  Plus,
  Upload,
  Search,
  Filter,
  CheckCircle2,
  Users,
  Briefcase,
  AlertCircle,
} from "lucide-react";
import { CompanyItem, CompanyStatus, ContactItem, ContactDeal } from "../../types/crm";
import { calculateCompanySummaryMetrics } from "../../data/mockCompaniesData";
import { MOCK_CONTACT_TAGS, MOCK_OWNERS } from "../../data/mockContactsData";
import { useCRM } from "../../context/CRMContext";
import { getLocalDateString } from "../../utils/formatters";
import { CompanyMetrics } from "./CompanyMetrics";
import { CompanyFilters, CompanyFilterState } from "./CompanyFilters";
import { CompanyTable } from "./CompanyTable";
import { CompanyCard } from "./CompanyCard";
import { CompanyBulkActions } from "./CompanyBulkActions";
import { CompanyFormModal } from "./CompanyFormModal";
import { CompanyDetailDrawer } from "./CompanyDetailDrawer";
import { CreateDealFromCompanyModal } from "./CreateDealFromCompanyModal";
import { CompanyImportModal } from "./CompanyImportModal";
import { CompanyExportMenu } from "./CompanyExportMenu";
import { ContactFormModal } from "../contacts/ContactFormModal";

interface CompaniesPageProps {
  sharedContacts?: ContactItem[];
  onAddContact?: (newContact: Partial<ContactItem>) => void;
  onOpenContactDetail?: (contact: ContactItem) => void;
}

export const CompaniesPage: React.FC<CompaniesPageProps> = ({
  onAddContact,
  onOpenContactDetail,
}) => {
  const {
    companies: rawCompanies,
    contacts: globalContacts,
    deals: globalDeals,
    addCompany,
    updateCompany,
    archiveCompany,
    bulkArchiveCompanies,
    bulkUpdateCompaniesOwner,
    bulkUpdateCompaniesStatus,
    bulkAddCompanyTags,
    bulkRemoveCompanyTags,
    addContact,
    addDeal,
    addTask,
  } = useCRM();

  // Enriched companies dynamically carrying their live global contacts and global deals
  const companies = useMemo(() => {
    return rawCompanies.map((comp) => {
      const compContacts = globalContacts.filter(
        (cnt) =>
          cnt.companyId === comp.id ||
          (cnt.companyName &&
            cnt.companyName.toLowerCase().trim() === comp.name.toLowerCase().trim())
      );
      const compDeals = globalDeals.filter((d) => d.companyId === comp.id);
      return {
        ...comp,
        contacts: compContacts,
        deals: compDeals,
      };
    });
  }, [rawCompanies, globalContacts, globalDeals]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filter State
  const [filters, setFilters] = useState<CompanyFilterState>({
    searchQuery: "",
    status: "all",
    ownerId: "all",
    segment: "all",
    size: "all",
    hasOpenDeals: false,
    withoutActivity: false,
    tag: "all",
    sortBy: "recent",
  });

  // Modal / Drawer States
  const [editingCompany, setEditingCompany] = useState<CompanyItem | null | undefined>(undefined);
  // undefined = modal closed, null = creating new company, CompanyItem = editing
  const [drawerCompany, setDrawerCompany] = useState<CompanyItem | null>(null);
  const [dealModalCompany, setDealModalCompany] = useState<CompanyItem | null>(null);
  const [contactModalCompany, setContactModalCompany] = useState<CompanyItem | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Compute live KPI metrics from active companies
  const summaryMetrics = useMemo(() => {
    return calculateCompanySummaryMetrics(companies);
  }, [companies]);

  // Filter and Sort Companies
  const filteredCompanies = useMemo(() => {
    return companies.filter((comp) => {
      // 1. Search Query
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase().trim();
        const cleanCnpj = q.replace(/\D/g, "");
        const matchName = comp.name.toLowerCase().includes(q);
        const matchLegal = (comp.legalName || "").toLowerCase().includes(q);
        const matchCnpj = cleanCnpj.length >= 3 && (comp.cnpj || "").replace(/\D/g, "").includes(cleanCnpj);
        const matchDomain = (comp.domain || "").toLowerCase().includes(q);
        const matchCity = (comp.city || comp.address?.city || "").toLowerCase().includes(q);
        const matchContact = comp.contacts?.some((c) => c.fullName.toLowerCase().includes(q));

        if (!matchName && !matchLegal && !matchCnpj && !matchDomain && !matchCity && !matchContact) {
          return false;
        }
      }

      // 2. Status
      if (filters.status !== "all" && comp.status !== filters.status) {
        return false;
      }

      // 3. Owner
      if (filters.ownerId !== "all" && comp.ownerId !== filters.ownerId) {
        return false;
      }

      // 4. Segment
      if (filters.segment !== "all" && comp.segment !== filters.segment) {
        return false;
      }

      // 5. Size
      if (filters.size !== "all" && comp.size !== filters.size) {
        return false;
      }

      // 6. Has Open Deals
      if (filters.hasOpenDeals) {
        const openCount = comp.deals ? comp.deals.filter((d) => d.status === "open").length : 0;
        if (openCount === 0) return false;
      }

      // 7. Without Activity (+30 days)
      if (filters.withoutActivity) {
        if (!comp.daysWithoutActivity || comp.daysWithoutActivity <= 30) return false;
      }

      // 8. Tag
      if (filters.tag !== "all") {
        if (!comp.tags || !comp.tags.includes(filters.tag)) return false;
      }

      return true;
    }).sort((a, b) => {
      if (filters.sortBy === "name_asc") {
        return a.name.localeCompare(b.name);
      }
      if (filters.sortBy === "highest_pipeline") {
        const valA = a.deals ? a.deals.filter((d) => d.status === "open").reduce((acc, d) => acc + (d.value || 0), 0) : 0;
        const valB = b.deals ? b.deals.filter((d) => d.status === "open").reduce((acc, d) => acc + (d.value || 0), 0) : 0;
        return valB - valA;
      }
      if (filters.sortBy === "most_deals") {
        const cntA = a.deals ? a.deals.filter((d) => d.status === "open").length : 0;
        const cntB = b.deals ? b.deals.filter((d) => d.status === "open").length : 0;
        return cntB - cntA;
      }
      if (filters.sortBy === "last_activity") {
        const daysA = a.daysWithoutActivity || 0;
        const daysB = b.daysWithoutActivity || 0;
        return daysA - daysB;
      }
      // default: recent
      return 0;
    });
  }, [companies, filters]);

  // Selection handlers
  const handleSelectToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllToggle = () => {
    if (selectedIds.length === filteredCompanies.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCompanies.map((c) => c.id));
    }
  };

  // Create or Update Company
  const handleSaveCompany = (companyData: Partial<CompanyItem>) => {
    if (editingCompany && editingCompany.id) {
      // Edit existing
      updateCompany(editingCompany.id, companyData);
      showToast(`Empresa "${companyData.name}" atualizada com sucesso!`);
      if (drawerCompany && drawerCompany.id === editingCompany.id) {
        setDrawerCompany({ ...drawerCompany, ...companyData } as CompanyItem);
      }
    } else {
      // Create new
      addCompany(companyData);
      showToast(`Empresa "${companyData.name || 'Nova'}" cadastrada com sucesso!`);
    }

    setEditingCompany(undefined);
  };

  // Archive single company
  const handleArchiveSingleCompany = (comp: CompanyItem) => {
    archiveCompany(comp.id);
    setSelectedIds(selectedIds.filter((id) => id !== comp.id));
    showToast(`Empresa "${comp.name}" arquivada com sucesso.`);
    if (drawerCompany?.id === comp.id) setDrawerCompany(null);
  };

  // Bulk Actions
  const handleBulkChangeOwner = (newOwnerId: string, newOwnerName: string) => {
    bulkUpdateCompaniesOwner(selectedIds, newOwnerId, newOwnerName);
    showToast(`Responsável atualizado para ${selectedIds.length} empresas.`);
    setSelectedIds([]);
  };

  const handleBulkChangeStatus = (newStatus: CompanyStatus) => {
    bulkUpdateCompaniesStatus(selectedIds, newStatus);
    showToast(`Status atualizado para ${selectedIds.length} empresas.`);
    setSelectedIds([]);
  };

  const handleBulkAddTag = (tag: string) => {
    bulkAddCompanyTags(selectedIds, tag);
    showToast(`Tag "${tag}" adicionada a ${selectedIds.length} empresas.`);
    setSelectedIds([]);
  };

  const handleBulkRemoveTag = (tag: string) => {
    bulkRemoveCompanyTags(selectedIds, tag);
    showToast(`Tag "${tag}" removida das empresas selecionadas.`);
    setSelectedIds([]);
  };

  const handleBulkCreateTask = (taskTitle: string) => {
    selectedIds.forEach((id) => {
      const c = companies.find((item) => item.id === id);
      if (c) {
        addTask({
          title: taskTitle,
          dueDate: getLocalDateString(new Date(Date.now() + 86400000)),
          ownerId: c.ownerId,
          ownerName: c.ownerName,
          priority: "medium",
          entityType: "company",
          entityId: c.id,
          entityName: c.name,
        });
      }
    });
    showToast(`Tarefa "${taskTitle}" agendada para ${selectedIds.length} empresas.`);
    setSelectedIds([]);
  };

  const handleBulkArchive = () => {
    bulkArchiveCompanies(selectedIds);
    showToast(`${selectedIds.length} empresas arquivadas.`);
    setSelectedIds([]);
  };

  // Import Companies Simulation
  const handleImportCompanies = (newComps: Partial<CompanyItem>[]) => {
    newComps.forEach((c) => addCompany(c));
    setShowImportModal(false);
    showToast(`${newComps.length} empresas importadas com sucesso!`);
  };

  // Save Deal from Company Context
  const handleSaveDealFromCompany = (newDeal: ContactDeal, selectedContactId?: string) => {
    if (!dealModalCompany) return;

    const selContact = selectedContactId
      ? globalContacts.find((c) => c.id === selectedContactId)
      : undefined;

    addDeal({
      ...newDeal,
      companyId: dealModalCompany.id,
      companyName: dealModalCompany.name,
      contactId: selectedContactId || undefined,
      contactName: selContact ? selContact.fullName : undefined,
    });

    setDealModalCompany(null);
    showToast(`Oportunidade "${newDeal.name}" criada em ${dealModalCompany.name}!`);
  };

  // Create Contact Handler from Company Context
  const handleCreateContactForCompany = (comp: CompanyItem) => {
    setContactModalCompany(comp);
  };

  const handleSaveContactFromCompany = (contactPayload: Partial<ContactItem>) => {
    if (!contactModalCompany) return;
    addContact({
      ...contactPayload,
      companyId: contactModalCompany.id,
      companyName: contactModalCompany.name,
      ownerId: contactPayload.ownerId || contactModalCompany.ownerId,
      ownerName: contactPayload.ownerName || contactModalCompany.ownerName,
      ownerAvatar: contactPayload.ownerAvatar || contactModalCompany.ownerAvatar,
    });
    setContactModalCompany(null);
    showToast(
      `Contato ${contactPayload.fullName || "novo"} cadastrado e vinculado a ${contactModalCompany.name}!`
    );
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-800 flex items-center gap-3 animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-md shadow-indigo-600/20">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Gestão de Empresas
              </h1>
              <p className="text-xs font-semibold text-slate-500">
                360° Account Management B2B — Organizações e Prospects
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Export Button */}
          <CompanyExportMenu
            companiesToExport={filteredCompanies}
            selectedCount={selectedIds.length}
            totalFilteredCount={filteredCompanies.length}
          />

          {/* Import Button */}
          <button
            onClick={() => setShowImportModal(true)}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl text-xs flex items-center gap-2 transition-colors"
          >
            <Upload className="h-4 w-4 text-slate-600" />
            <span className="hidden sm:inline">Importar</span>
          </button>

          {/* New Company Primary CTA */}
          <button
            onClick={() => setEditingCompany(null)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Empresa</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <CompanyMetrics metrics={summaryMetrics} />

      {/* Search & Filter Bar */}
      <CompanyFilters
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={() =>
          setFilters({
            searchQuery: "",
            status: "all",
            ownerId: "all",
            segment: "all",
            size: "all",
            hasOpenDeals: false,
            withoutActivity: false,
            tag: "all",
            sortBy: "recent",
          })
        }
        totalFilteredCount={filteredCompanies.length}
      />

      {/* Data Views (Desktop Table vs Mobile Cards) */}
      {filteredCompanies.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200/80 rounded-3xl shadow-xs">
          <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-extrabold text-slate-800 text-base">
            Nenhuma empresa encontrada
          </h3>
          <p className="text-xs font-medium text-slate-500 mt-1 max-w-sm mx-auto">
            Não há organizações correspondentes aos filtros aplicados. Tente ajustar os termos da busca.
          </p>
          <button
            onClick={() =>
              setFilters({
                searchQuery: "",
                status: "all",
                ownerId: "all",
                segment: "all",
                size: "all",
                hasOpenDeals: false,
                withoutActivity: false,
                tag: "all",
                sortBy: "recent",
              })
            }
            className="mt-4 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition-colors"
          >
            Limpar Filtros de Busca
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <CompanyTable
              companies={filteredCompanies}
              selectedIds={selectedIds}
              onSelectToggle={handleSelectToggle}
              onSelectAllToggle={handleSelectAllToggle}
              onOpenDrawer={(comp) => setDrawerCompany(comp)}
              onEditCompany={(comp) => setEditingCompany(comp)}
              onCreateDeal={(comp) => setDealModalCompany(comp)}
              onCreateContact={handleCreateContactForCompany}
              onArchiveCompany={handleArchiveSingleCompany}
            />
          </div>

          {/* Mobile Cards List */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredCompanies.map((comp) => (
              <CompanyCard
                key={comp.id}
                company={comp}
                isSelected={selectedIds.includes(comp.id)}
                onSelectToggle={handleSelectToggle}
                onOpenDrawer={(c) => setDrawerCompany(c)}
                onEditCompany={(c) => setEditingCompany(c)}
                onCreateDeal={(c) => setDealModalCompany(c)}
                onCreateContact={handleCreateContactForCompany}
                onArchiveCompany={handleArchiveSingleCompany}
              />
            ))}
          </div>
        </>
      )}

      {/* Floating Bulk Actions Bar */}
      <CompanyBulkActions
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onChangeOwner={handleBulkChangeOwner}
        onChangeStatus={handleBulkChangeStatus}
        onAddTag={handleBulkAddTag}
        onRemoveTag={handleBulkRemoveTag}
        onCreateBulkTask={handleBulkCreateTask}
        onExportSelected={() => {
          showToast(`Exportando ${selectedIds.length} empresas selecionadas...`);
        }}
        onArchiveSelected={handleBulkArchive}
      />

      {/* Modal: New / Edit Company */}
      {editingCompany !== undefined && (
        <CompanyFormModal
          initialCompany={editingCompany}
          existingCompanies={companies}
          onClose={() => setEditingCompany(undefined)}
          onSave={handleSaveCompany}
          onOpenExistingCompany={(dup) => {
            setEditingCompany(undefined);
            setDrawerCompany(dup);
          }}
        />
      )}

      {/* Modal: Create Deal from Company */}
      {dealModalCompany && (
        <CreateDealFromCompanyModal
          company={dealModalCompany}
          availableContacts={globalContacts.filter(
            (c) =>
              c.companyId === dealModalCompany.id ||
              (c.companyName &&
                c.companyName.toLowerCase().trim() === dealModalCompany.name.toLowerCase().trim())
          )}
          onClose={() => setDealModalCompany(null)}
          onSaveDeal={handleSaveDealFromCompany}
        />
      )}

      {/* Modal: Create Contact for Company */}
      {contactModalCompany && (
        <ContactFormModal
          initialContact={{
            id: "",
            organizationId: "org-nexus-01",
            firstName: "",
            fullName: "",
            companyId: contactModalCompany.id,
            companyName: contactModalCompany.name,
            ownerId: contactModalCompany.ownerId,
            ownerName: contactModalCompany.ownerName,
            ownerAvatar: contactModalCompany.ownerAvatar,
            lifecycleStatus: "active",
            source: "Manual",
            tags: [],
            createdAt: "",
            updatedAt: "",
          }}
          existingContacts={globalContacts}
          availableOwners={MOCK_OWNERS}
          availableTags={MOCK_CONTACT_TAGS}
          onClose={() => setContactModalCompany(null)}
          onSave={handleSaveContactFromCompany}
        />
      )}

      {/* Modal: Import Companies */}
      {showImportModal && (
        <CompanyImportModal
          onClose={() => setShowImportModal(false)}
          onImportCompanies={handleImportCompanies}
        />
      )}

      {/* Drawer: 360° View */}
      {drawerCompany && (
        <CompanyDetailDrawer
          company={companies.find((c) => c.id === drawerCompany.id) || drawerCompany}
          sharedContacts={globalContacts}
          onClose={() => setDrawerCompany(null)}
          onEditCompany={(comp) => {
            setDrawerCompany(null);
            setEditingCompany(comp);
          }}
          onCreateDeal={(comp) => setDealModalCompany(comp)}
          onCreateContact={handleCreateContactForCompany}
          onUpdateCompany={(updatedComp) => {
            updateCompany(updatedComp.id, updatedComp);
          }}
          onOpenContactDetail={onOpenContactDetail}
        />
      )}
    </div>
  );
};
