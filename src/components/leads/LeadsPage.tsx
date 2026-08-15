import React, { useState, useMemo } from "react";
import { LeadItem, LeadStatus } from "../../types/crm";
import {
  MOCK_OWNERS,
  LeadSummaryMetrics,
} from "../../data/mockLeadsData";
import { useCRM } from "../../context/CRMContext";
import { LeadsHeader } from "./LeadsHeader";
import { LeadMetrics } from "./LeadMetrics";
import { LeadFilters, FilterState } from "./LeadFilters";
import { LeadTable } from "./LeadTable";
import { LeadCard } from "./LeadCard";
import { LeadBulkActions } from "./LeadBulkActions";
import { LeadFormModal } from "./LeadFormModal";
import { LeadDetailDrawer } from "./LeadDetailDrawer";
import { LeadConversionModal } from "./LeadConversionModal";
import { LeadDisqualificationModal } from "./LeadDisqualificationModal";
import { LeadImportModal } from "./LeadImportModal";
import { LeadExportMenu } from "./LeadExportMenu";
import { Users, SearchX, RotateCcw, Plus } from "lucide-react";
import { hasSupabaseConfiguration } from "../../lib/supabase/env";

interface LeadsPageProps {
  onShowToast: (message: string) => void;
  currentPeriod?: string;
  onLeadsCountChange?: (count: number) => void;
}

export const LeadsPage: React.FC<LeadsPageProps> = ({
  onShowToast,
  currentPeriod = "este_mes",
  onLeadsCountChange,
}) => {
  const {
    leads,
    contacts,
    companies,
    addLead,
    updateLead,
    archiveLead,
    bulkArchiveLeads,
    bulkUpdateLeadsOwner,
    bulkUpdateLeadsStatus,
    bulkAddLeadTag,
    bulkRemoveLeadTag,
    addContact,
    addCompany,
    addDeal,
    pipelines,
    currentOrganizationRole,
    members,
  } = useCRM();
  const ownerOptions = hasSupabaseConfiguration() ? members : MOCK_OWNERS;
  const canWriteLeads = currentOrganizationRole !== "viewer" && currentOrganizationRole !== "suspended";
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Sync count with parent / sidebar
  React.useEffect(() => {
    onLeadsCountChange?.(leads.filter((lead) => !lead.archivedAt && !lead.archived).length);
  }, [leads, onLeadsCountChange]);

  // Filters State
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: "",
    status: "all",
    ownerId: "all",
    source: "all",
    tag: "all",
    scoreTier: "all",
    hasPendingTask: false,
    noActivity: false,
    sortBy: "newest",
  });

  // Modal / Drawer States
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingLead, setEditingLead] = useState<LeadItem | null>(null);

  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedDetailLead, setSelectedDetailLead] = useState<LeadItem | null>(
    null
  );

  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [convertingLead, setConvertingLead] = useState<LeadItem | null>(null);

  const [disqualifyModalOpen, setDisqualifyModalOpen] = useState(false);
  const [disqualifyingLead, setDisqualifyingLead] = useState<LeadItem | null>(
    null
  );

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  // Derived active lead for detail drawer
  const activeDetailLead = useMemo(() => {
    if (!selectedDetailLead) return null;
    return leads.find((l) => l.id === selectedDetailLead.id) || selectedDetailLead;
  }, [leads, selectedDetailLead]);

  // Compute dynamic summary metrics derived strictly from the leads array
  const summaryMetrics: LeadSummaryMetrics = useMemo(() => {
    const activeLeads = leads.filter((lead) => !lead.archivedAt && !lead.archived);
    const total = activeLeads.length;
    // Novos no período: leads com status "new" ou criados recentemente na base
    const newInPeriodCount = activeLeads.filter(
      (l) => l.status === "new" || l.createdAt === "Hoje" || l.createdAt.includes("08/2026")
    ).length;
    const qualified = activeLeads.filter((l) => l.status === "qualified").length;
    const inContact = activeLeads.filter((l) => l.status === "contacted").length;
    const converted = activeLeads.filter((l) => l.status === "converted").length;
    const noAct = activeLeads.filter(
      (l) =>
        l.lastActivityText.includes("dias") ||
        l.lastActivityText.includes("semanas")
    ).length;

    // Fórmula da Taxa de Conversão: (leads_convertidos / total_leads) * 100
    const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) : "0.0";

    return {
      totalLeads: total,
      newInPeriod: Math.min(newInPeriodCount, total),
      qualified,
      inContact,
      conversionRatePercent: parseFloat(conversionRate),
      noActivityCount: noAct,
    };
  }, [leads]);

  // Filter & Sort Logic
  const filteredLeads = useMemo(() => {
    return leads
      .filter((lead) => !lead.archivedAt && !lead.archived)
      .filter((lead) => {
        // Search Query
        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase();
          const matchName = lead.name.toLowerCase().includes(q);
          const matchCompany = (lead.company || "").toLowerCase().includes(q);
          const matchEmail = (lead.email || "").toLowerCase().includes(q);
          const matchPhone = (lead.phone || "").toLowerCase().includes(q);
          if (!matchName && !matchCompany && !matchEmail && !matchPhone) {
            return false;
          }
        }

        // Status Filter
        if (filters.status !== "all" && lead.status !== filters.status) {
          return false;
        }

        // Owner Filter
        if (filters.ownerId !== "all" && lead.ownerId !== filters.ownerId) {
          return false;
        }

        // Source Filter
        if (filters.source !== "all" && lead.source !== filters.source) {
          return false;
        }

        // Tag Filter
        if (filters.tag !== "all" && !lead.tags.includes(filters.tag)) {
          return false;
        }

        // Score Tier Filter
        if (filters.scoreTier !== "all") {
          const s = lead.score;
          if (filters.scoreTier === "very_high" && s < 85) return false;
          if (filters.scoreTier === "high" && (s < 70 || s >= 85)) return false;
          if (filters.scoreTier === "medium" && (s < 40 || s >= 70)) return false;
          if (filters.scoreTier === "low" && s >= 40) return false;
        }

        // Pending Task Boolean
        if (
          filters.hasPendingTask &&
          (!lead.nextTaskText || lead.nextTaskText === "Nenhuma")
        ) {
          return false;
        }

        // No Activity Boolean
        if (
          filters.noActivity &&
          !lead.lastActivityText.includes("dias") &&
          !lead.lastActivityText.includes("semanas")
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === "score_desc") return b.score - a.score;
        if (filters.sortBy === "score_asc") return a.score - b.score;
        if (filters.sortBy === "name") return a.name.localeCompare(b.name);
        if (filters.sortBy === "oldest") return a.id.localeCompare(b.id);
        // Default: newest
        return b.id.localeCompare(a.id);
      });
  }, [leads, filters]);

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredLeads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredLeads.map((l) => l.id));
    }
  };

  // Actions
  const handleOpenCreate = () => {
    if (!canWriteLeads) { onShowToast("Seu perfil possui acesso somente leitura."); return; }
    setFormMode("create");
    setEditingLead(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (lead: LeadItem) => {
    if (!canWriteLeads) { onShowToast("Seu perfil possui acesso somente leitura."); return; }
    setFormMode("edit");
    setEditingLead(lead);
    setFormModalOpen(true);
  };

  const handleOpenDetail = (lead: LeadItem) => {
    setSelectedDetailLead(lead);
    setDetailDrawerOpen(true);
  };

  const handleOpenConvert = (lead: LeadItem) => {
    if (!canWriteLeads) { onShowToast("Seu perfil possui acesso somente leitura."); return; }
    if (lead.status === "converted") {
      onShowToast("Este lead já foi convertido e não pode ser reconvertido.");
      return;
    }
    if (lead.status === "disqualified") {
      onShowToast("Lead desqualificado. Altere o status para requalificá-lo antes de converter.");
      return;
    }
    setConvertingLead(lead);
    setConvertModalOpen(true);
  };

  const handleOpenDisqualify = (lead: LeadItem) => {
    setDisqualifyingLead(lead);
    setDisqualifyModalOpen(true);
  };

  const handleSaveLead = (leadData: Partial<LeadItem>) => {
    if (formMode === "create") {
      const newLeadObj: LeadItem = {
        id: `lead-${Date.now()}`,
        organizationId: "org-nexus-01",
        name: leadData.name || "Novo Lead",
        company: leadData.company || "",
        jobTitle: leadData.jobTitle || "",
        email: leadData.email || "",
        phone: leadData.phone || "",
        status: leadData.status || "new",
        source: leadData.source || "Site",
        ownerId: leadData.ownerId || "usr-1",
        ownerName: leadData.ownerName || "Mariana Costa",
        ownerAvatar: leadData.ownerAvatar,
        score: leadData.score || 65,
        tags: leadData.tags || [],
        createdAt: "Hoje",
        updatedAt: "agora",
        lastActivityText: "agora",
        nextTaskText: "Nenhuma",
      };

      addLead(newLeadObj);
      onShowToast(`Lead "${newLeadObj.name}" criado com sucesso!`);
    } else if (formMode === "edit" && editingLead) {
      updateLead(editingLead.id, leadData);

      // If drawer is open with this lead, update it too
      if (selectedDetailLead?.id === editingLead.id) {
        setSelectedDetailLead((prev) => (prev ? { ...prev, ...leadData } : null));
      }

      onShowToast(`Lead "${leadData.name}" atualizado com sucesso!`);
    }
  };

  const handleConfirmConvert = async (leadId: string, convertedData: any) => {
    const sourceLead = leads.find((lead) => lead.id === leadId);
    if (!sourceLead || sourceLead.status === "converted") {
      onShowToast("Este lead já foi convertido e não pode ser reconvertido.");
      return;
    }
    if (!convertedData.pipelineId || !convertedData.stageId) { onShowToast("Selecione um pipeline e uma etapa reais."); return; }
    try {
      const response = await fetch("/api/commercial/leads/convert", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leadId, pipelineId: convertedData.pipelineId, stageId: convertedData.stageId, companyName: convertedData.companyName, contactName: convertedData.contactName, dealName: convertedData.dealName, value: convertedData.estimatedValue }) });
      const payload = await response.json() as { conversion?: { company_id: string; contact_id: string; deal_id: string }; error?: string };
      if (!response.ok || !payload.conversion) { onShowToast(payload.error || "Não foi possível converter o lead."); return; }
      updateLead(leadId, { status: "converted", convertedContactId: payload.conversion.contact_id, convertedCompanyId: payload.conversion.company_id, convertedDealId: payload.conversion.deal_id, convertedAt: new Date().toISOString(), lastActivityText: "Convertido em Negócio" });
      if (selectedDetailLead?.id === leadId) setSelectedDetailLead((prev) => prev ? { ...prev, status: "converted", convertedContactId: payload.conversion?.contact_id, convertedCompanyId: payload.conversion?.company_id, convertedDealId: payload.conversion?.deal_id, convertedAt: new Date().toISOString(), lastActivityText: "Convertido em Negócio" } : null);
      onShowToast(`Lead convertido! Negócio "${convertedData.dealName}" criado no pipeline.`);
    } catch { onShowToast("Não foi possível concluir a conversão."); }
    /*
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? {
              ...l,
              status: "converted" as LeadStatus,
              updatedAt: "agora",
              lastActivityText: "Convertido em Negócio",
            }
          : l
      )
    );
    */

    if (selectedDetailLead?.id === leadId) {
      setSelectedDetailLead((prev) =>
        prev
          ? {
              ...prev,
              status: "converted",
              convertedContactId: sourceLead.convertedContactId,
              convertedCompanyId: sourceLead.convertedCompanyId,
              convertedDealId: sourceLead.convertedDealId,
              convertedAt: new Date().toLocaleDateString("pt-BR"),
              lastActivityText: "Convertido em Negócio",
            }
          : null
      );
    }

  };

  const handleConfirmDisqualify = (
    leadId: string,
    reason: any,
    note?: string
  ) => {
    updateLead(leadId, { status: "disqualified" as LeadStatus, disqualificationReason: reason, disqualificationNote: note, lastActivityText: `Desqualificado: ${reason}` });
    /*
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? {
              ...l,
              status: "disqualified" as LeadStatus,
              disqualificationReason: reason,
              disqualificationNote: note,
              updatedAt: "agora",
              lastActivityText: `Desqualificado: ${reason}`,
            }
          : l
      )
    );
    */

    if (selectedDetailLead?.id === leadId) {
      setSelectedDetailLead((prev) =>
        prev
          ? {
              ...prev,
              status: "disqualified",
              disqualificationReason: reason,
              disqualificationNote: note,
            }
          : null
      );
    }

    onShowToast(`Lead desqualificado por motivo: ${reason}`);
  };

  // Bulk Handlers
  const handleBulkUpdateOwner = (ownerId: string) => {
    const targetCount = selectedIds.length;
    if (targetCount === 0) return;

    const ownerObj = ownerOptions.find((o) => o.id === ownerId);
    const ownerName = ownerObj?.name || "Sem responsável";
    const ownerAvatar = ownerObj ? ownerObj.avatar : undefined;

    bulkUpdateLeadsOwner(selectedIds, ownerId, ownerName, ownerAvatar);

    if (selectedDetailLead && selectedIds.includes(selectedDetailLead.id)) {
      setSelectedDetailLead((prev) =>
        prev ? { ...prev, ownerId, ownerName, ownerAvatar } : null
      );
    }

    onShowToast(
      `Responsável alterado para "${ownerName}" em ${targetCount} lead(s).`
    );
    setSelectedIds([]);
  };

  const handleBulkUpdateStatus = (status: LeadStatus) => {
    const targetCount = selectedIds.length;
    if (targetCount === 0) return;

    if (status === "converted") {
      onShowToast("Conversão em lote não é permitida. Converta cada lead individualmente.");
      return;
    }

    const statusMap: Record<string, string> = {
      new: "Novo",
      contacted: "Em contato",
      qualified: "Qualificado",
      nurturing: "Nutrição",
      disqualified: "Desqualificado",
    };

    bulkUpdateLeadsStatus(selectedIds, status);

    if (selectedDetailLead && selectedIds.includes(selectedDetailLead.id)) {
      setSelectedDetailLead((prev) => (prev ? { ...prev, status } : null));
    }

    onShowToast(
      `Status alterado para "${statusMap[status] || status}" em ${targetCount} lead(s).`
    );
    setSelectedIds([]);
  };

  const handleBulkAddTag = (tag: string) => {
    const targetCount = selectedIds.length;
    if (targetCount === 0) return;

    bulkAddLeadTag(selectedIds, tag);

    if (selectedDetailLead && selectedIds.includes(selectedDetailLead.id)) {
      setSelectedDetailLead((prev) =>
        prev && !prev.tags.includes(tag)
          ? { ...prev, tags: [...prev.tags, tag] }
          : prev
      );
    }

    onShowToast(`Tag "${tag}" vinculada a ${targetCount} lead(s).`);
    setSelectedIds([]);
  };

  const handleBulkRemoveTag = (tag: string) => {
    const targetCount = selectedIds.length;
    if (targetCount === 0) return;

    bulkRemoveLeadTag(selectedIds, tag);
    onShowToast(`Tag "${tag}" removida de ${targetCount} lead(s).`);
    setSelectedIds([]);
  };

  const handleBulkCreateTask = () => {
    onShowToast(
      `Tarefa em lote agendada para os ${selectedIds.length} lead(s) selecionados.`
    );
    setSelectedIds([]);
  };

  const handleBulkExport = () => {
    handleExportScope("selected");
  };

  const handleBulkArchive = () => {
    const targetCount = selectedIds.length;
    if (targetCount === 0) return;

    bulkArchiveLeads(selectedIds);

    if (selectedDetailLead && selectedIds.includes(selectedDetailLead.id)) {
      setDetailDrawerOpen(false);
      setSelectedDetailLead(null);
    }

    onShowToast(`${targetCount} lead(s) foram arquivados com sucesso.`);
    setSelectedIds([]);
  };

  const handleExportScope = (type: "all" | "filtered" | "selected") => {
    let listToExport = leads;
    if (type === "filtered") listToExport = filteredLeads;
    if (type === "selected") listToExport = leads.filter((l) => selectedIds.includes(l.id));

    if (listToExport.length === 0) {
      onShowToast("Nenhum registro para exportar.");
      setExportMenuOpen(false);
      return;
    }

    const headers = [
      "ID",
      "Nome",
      "Empresa",
      "Cargo",
      "E-mail",
      "Telefone",
      "Status",
      "Origem",
      "Responsavel",
      "Score",
      "CriadoEm",
    ];

    const rows = listToExport.map((l) => [
      l.id,
      `"${l.name.replace(/"/g, '""')}"`,
      `"${(l.company || "").replace(/"/g, '""')}"`,
      `"${(l.jobTitle || "").replace(/"/g, '""')}"`,
      `"${(l.email || "").replace(/"/g, '""')}"`,
      `"${(l.phone || "").replace(/"/g, '""')}"`,
      l.status,
      l.source,
      `"${l.ownerName.replace(/"/g, '""')}"`,
      l.score,
      l.createdAt,
    ]);

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `nexus_leads_${type}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast(
      `Download iniciado: ${listToExport.length} leads exportados em CSV.`
    );
    setExportMenuOpen(false);
  };

  const totalCount = leads.length;

  return (
    <div className="space-y-4 sm:space-y-5 min-w-0">
      {/* 1. Module Header */}
      <LeadsHeader
        onOpenNewLead={handleOpenCreate}
        onOpenImport={() => setImportModalOpen(true)}
        onOpenExport={() => setExportMenuOpen(true)}
        canWrite={canWriteLeads}
      />

      {/* 2. Compact Performance Metrics Strip */}
      <LeadMetrics metrics={summaryMetrics} />

      {/* 3. Search & Filters Bar */}
      <LeadFilters
        filters={filters}
        onFilterChange={setFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        totalFilteredCount={filteredLeads.length}
      />

      {/* 4. Leads List / Cards Grid */}
      {filteredLeads.length > 0 ? (
        viewMode === "table" ? (
            <LeadTable
              leads={filteredLeads}
              canWrite={canWriteLeads}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            onOpenDetail={handleOpenDetail}
            onOpenEdit={handleOpenEdit}
            onOpenConvert={handleOpenConvert}
            onOpenDisqualify={handleOpenDisqualify}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredLeads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  canWrite={canWriteLeads}
                isSelected={selectedIds.includes(lead.id)}
                onToggleSelect={handleToggleSelect}
                onOpenDetail={handleOpenDetail}
                onOpenEdit={handleOpenEdit}
                onOpenConvert={handleOpenConvert}
                onOpenDisqualify={handleOpenDisqualify}
              />
            ))}
          </div>
        )
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border border-slate-200/80 shadow-2xs space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
            <SearchX className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Nenhum lead encontrado
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Não encontramos nenhum lead correspondente aos critérios de busca ou filtros selecionados.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() =>
                setFilters({
                  searchQuery: "",
                  status: "all",
                  ownerId: "all",
                  source: "all",
                  tag: "all",
                  scoreTier: "all",
                  hasPendingTask: false,
                  noActivity: false,
                  sortBy: "newest",
                })
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Limpar Filtros</span>
            </button>
            {canWriteLeads && <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Novo Lead</span>
            </button>}
          </div>
        </div>
      )}

      {/* 5. Contextual Bulk Actions Bar */}
      {canWriteLeads && <LeadBulkActions
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onBulkUpdateOwner={handleBulkUpdateOwner}
        onBulkUpdateStatus={handleBulkUpdateStatus}
        onBulkAddTag={handleBulkAddTag}
        onBulkRemoveTag={handleBulkRemoveTag}
        onBulkCreateTask={handleBulkCreateTask}
        onBulkExport={handleBulkExport}
        onBulkArchive={handleBulkArchive}
      />}

      {/* Modals & Drawers */}
      {canWriteLeads && <LeadFormModal
        isOpen={formModalOpen}
        mode={formMode}
        initialLead={editingLead}
        existingEmails={leads.map((l) => l.email).filter(Boolean)}
        onClose={() => setFormModalOpen(false)}
        onSubmitSuccess={handleSaveLead}
      />}

      <LeadDetailDrawer
        isOpen={detailDrawerOpen}
        lead={activeDetailLead}
        onClose={() => setDetailDrawerOpen(false)}
        onOpenEdit={handleOpenEdit}
        onOpenConvert={handleOpenConvert}
        onUpdateLead={(updated) => {
          setSelectedDetailLead(updated);
          updateLead(updated.id, updated);
        }}
      />

      {canWriteLeads && <LeadConversionModal
        isOpen={convertModalOpen}
        lead={convertingLead}
        onClose={() => setConvertModalOpen(false)}
        onConfirmConvert={handleConfirmConvert}
        pipelines={pipelines}
      />}

      <LeadDisqualificationModal
        isOpen={disqualifyModalOpen}
        lead={disqualifyingLead}
        onClose={() => setDisqualifyModalOpen(false)}
        onConfirmDisqualify={handleConfirmDisqualify}
      />

      <LeadImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportCompleted={(count) => {
          if (hasSupabaseConfiguration()) {
            onShowToast("Importação demonstrativa desativada com persistência real. Use a criação manual nesta fase.");
            return;
          }
          const importedLeads: LeadItem[] = Array.from({ length: Math.min(count, 3) }).map((_, i) => ({
            id: `imp-${Date.now()}-${i}`,
            organizationId: "org-nexus-01",
            name: i === 0 ? "Bernardo Vasconcelos" : i === 1 ? "Luciana Prado" : "Guilherme Santos",
            company: i === 0 ? "Apex Logistics" : i === 1 ? "Prado Advocacia" : "Soma Distribuidora",
            jobTitle: i === 0 ? "Diretor Operacional" : i === 1 ? "Sócia Fundadora" : "Gerente de Compras",
            email: `contato.importado${i + 1}@nexusdemo.com.br`,
            phone: "(11) 98765-4321",
            status: "new",
            source: "Prospecção",
            ownerId: "usr-1",
            ownerName: "Mariana Costa",
            score: 72,
            tags: ["Importado CSV", "Outbound"],
            createdAt: "Hoje",
            updatedAt: "agora",
            lastActivityText: "Importado via CSV",
            nextTaskText: "Qualificar Lead",
          }));
          importedLeads.forEach((importedLead) => addLead(importedLead));
          onShowToast(`${count} novos leads importados via CSV com sucesso!`);
        }}
      />

      <LeadExportMenu
        isOpen={exportMenuOpen}
        onClose={() => setExportMenuOpen(false)}
        totalCount={totalCount}
        filteredCount={filteredLeads.length}
        selectedCount={selectedIds.length}
        onExport={handleExportScope}
      />
    </div>
  );
};
