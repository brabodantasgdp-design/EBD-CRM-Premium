import React, { useState, useMemo, useEffect } from "react";
import { useCRM } from "../../context/CRMContext";
import { PeriodOption, DealItem } from "../../types/crm";
import {
  MOCK_PIPELINES,
  PipelineConfig,
  PipelineStageConfig,
} from "../../data/mockPipelinesData";
import { DealsMetrics } from "./DealsMetrics";
import { DealsHeader } from "./DealsHeader";
import { DealsFilters, DEFAULT_DEAL_FILTERS, DealFilterState } from "./DealsFilters";
import { DealsKanban } from "./DealsKanban";
import { DealsTable } from "./DealsTable";
import { DealsBulkActions } from "./DealsBulkActions";
import { DealFormModal } from "./DealFormModal";
import { MarkLostModal } from "./MarkLostModal";
import { ReopenDealModal } from "./ReopenDealModal";
import { PipelineConfigPreviewModal } from "./PipelineConfigPreviewModal";
import { DealDetailDrawer } from "./DealDetailDrawer";
import { hasSupabaseConfiguration } from "../../lib/supabase/env";

interface DealsPageProps {
  onShowToast?: (message: string) => void;
  currentPeriod?: PeriodOption;
}

const AVAILABLE_OWNERS = [
  { id: "usr-1", name: "Mariana Costa" },
  { id: "usr-2", name: "Ricardo Alves" },
  { id: "usr-3", name: "Ana Beatriz" },
  { id: "usr-4", name: "Carlos Eduardo" },
];

export const DealsPage: React.FC<DealsPageProps> = ({
  onShowToast,
  currentPeriod = "este_mes",
}) => {
  const { deals, companies, contacts, pipelines, addDeal, updateDeal, moveDealStage, markDealWon, markDealLost, reopenDeal, archiveDeal, bulkArchiveDeals, members } = useCRM();
  const commercialPersistence = hasSupabaseConfiguration();
  const ownerOptions = commercialPersistence ? members : AVAILABLE_OWNERS;
  const realPipelines = useMemo<PipelineConfig[]>(() => pipelines.map((pipeline) => ({ id: pipeline.id, name: pipeline.name, description: pipeline.description || "", isDefault: pipeline.isDefault, stages: pipeline.stages.map((stage) => ({ id: stage.id, pipelineId: stage.pipelineId, name: stage.name, order: stage.position + 1, probability: stage.probability, color: stage.color || "slate" })) })), [pipelines]);

  // Active Pipeline & View Mode
  const [activePipeline, setActivePipeline] = useState<PipelineConfig>(
    commercialPersistence ? { id: "", name: "", description: "", isDefault: false, stages: [] } : MOCK_PIPELINES[0]
  );
  useEffect(() => { if (realPipelines.length && !realPipelines.some((pipeline) => pipeline.id === activePipeline.id)) setActivePipeline(realPipelines.find((pipeline) => pipeline.isDefault) || realPipelines[0]); }, [realPipelines, activePipeline.id]);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");

  // Filters State
  const [filters, setFilters] = useState<DealFilterState>(DEFAULT_DEAL_FILTERS);

  // Selection state for Bulk Actions
  const [selectedDealIds, setSelectedDealIds] = useState<string[]>([]);

  // Modal / Drawer States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [dealToEdit, setDealToEdit] = useState<DealItem | null>(null);
  const [initialStageForCreate, setInitialStageForCreate] =
    useState<PipelineStageConfig | null>(null);

  const [markLostDeal, setMarkLostDeal] = useState<DealItem | null>(null);
  const [reopenDealItem, setReopenDealItem] = useState<DealItem | null>(null);
  const [isPipelineConfigOpen, setIsPipelineConfigOpen] = useState(false);

  const [selectedDetailDeal, setSelectedDetailDeal] = useState<DealItem | null>(
    null
  );

  // Toast Helper
  const toast = (msg: string) => {
    if (onShowToast) onShowToast(msg);
  };

  // Collect unique tags from non-archived deals
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    deals.forEach((d) => {
      if (!d.archivedAt && !d.isArchived) {
        d.tags?.forEach((t) => set.add(t));
      }
    });
    return Array.from(set);
  }, [deals]);

  // Filtered Deals Engine (EXCLUDES ARCHIVED DEALS)
  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      // Exclude archived deals from active views and metrics
      if (deal.archivedAt || deal.isArchived) {
        return false;
      }

      // Filter by Active Pipeline
      if (deal.pipelineId && deal.pipelineId !== activePipeline.id) {
        return false;
      }

      // Filter by Status
      if (filters.status !== "all") {
        if (filters.status === "open" && deal.status !== "open") return false;
        if (filters.status === "won" && deal.status !== "won") return false;
        if (filters.status === "lost" && deal.status !== "lost") return false;
      }

      // Filter by Search Query (Name, Company, Contact, Owner)
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase().trim();
        const matchesName = deal.name.toLowerCase().includes(query);
        const matchesCompany =
          deal.companyName?.toLowerCase().includes(query) || false;
        const matchesContact =
          deal.contactName?.toLowerCase().includes(query) || false;
        const matchesOwner =
          deal.ownerName?.toLowerCase().includes(query) || false;

        if (!matchesName && !matchesCompany && !matchesContact && !matchesOwner) {
          return false;
        }
      }

      // Filter by Owner
      if (filters.ownerId !== "all" && deal.ownerId !== filters.ownerId) {
        return false;
      }

      // Filter by Company
      if (filters.companyId !== "all" && deal.companyId !== filters.companyId) {
        return false;
      }

      // Filter by Tag
      if (filters.tag !== "all" && (!deal.tags || !deal.tags.includes(filters.tag))) {
        return false;
      }

      // Filter by Inactivity
      if (filters.onlyInactive) {
        if (deal.lastActivityAt) return false;
      }

      // Filter by Value Range
      if (filters.minVal) {
        const min = parseFloat(filters.minVal);
        if (!isNaN(min) && (deal.value || 0) < min) return false;
      }

      if (filters.maxVal) {
        const max = parseFloat(filters.maxVal);
        if (!isNaN(max) && (deal.value || 0) > max) return false;
      }

      return true;
    });
  }, [deals, activePipeline, filters]);

  // Handlers
  const handleUpdateDealStage = (
    dealId: string,
    targetStage: PipelineStageConfig
  ) => {
    const targetDeal = deals.find((d) => d.id === dealId);
    if (!targetDeal) return;

    let newStatus: "open" | "won" | "lost" = targetDeal.status || "open";
    if (targetStage.id === "stg-ganho" || targetStage.name.toLowerCase().includes("ganho")) {
      newStatus = "won";
    }

    if (pipelines.length) moveDealStage(dealId, activePipeline.id, targetStage.id, "Movido pela interface");
    else updateDeal(dealId, {
      pipelineId: activePipeline.id,
      pipelineName: activePipeline.name,
      stageId: targetStage.id,
      stageName: targetStage.name,
      probability: targetStage.probability,
      status: newStatus,
    });

    toast(`Negócio "${targetDeal.name}" movido para "${targetStage.name}"`);
  };

  const handleSaveDeal = (dealData: Partial<DealItem>) => {
    if (dealToEdit) {
      updateDeal(dealToEdit.id, dealData);
      toast(`Negócio "${dealData.name || dealToEdit.name}" atualizado com sucesso!`);
    } else {
      const created = addDeal(dealData);
      toast(`Novo negócio "${created.name}" criado com sucesso!`);
    }
  };

  const handleConfirmMarkLost = (reason: string, note?: string) => {
    if (!markLostDeal) return;
    const nowFormatted = `${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
    if (pipelines.length) markDealLost(markLostDeal.id, reason, note);
    else updateDeal(markLostDeal.id, {
      status: "lost",
      probability: 0,
      lossReason: reason,
      lossNote: note,
      lostAt: nowFormatted,
      wonAt: undefined,
    });
    toast(`Negócio "${markLostDeal.name}" marcado como Perdido (${reason}).`);
    setMarkLostDeal(null);
  };

  const handleConfirmReopen = (
    pId: string,
    stgId: string,
    stgName: string,
    probability: number
  ) => {
    if (!reopenDealItem) return;
    const pipe = (commercialPersistence ? realPipelines : MOCK_PIPELINES).find((p) => p.id === pId);
    if (pipelines.length) reopenDeal(reopenDealItem.id, pId, stgId);
    else updateDeal(reopenDealItem.id, {
      status: "open",
      pipelineId: pId,
      pipelineName: pipe?.name || activePipeline.name,
      stageId: stgId,
      stageName: stgName,
      probability: probability,
      wonAt: undefined,
      lostAt: undefined,
      lossReason: undefined,
      lossNote: undefined,
    });
    toast(`Negócio "${reopenDealItem.name}" reaberto com sucesso em "${stgName}" (${probability}%).`);
    setReopenDealItem(null);
  };

  const handleMarkWon = (deal: DealItem) => {
    const nowFormatted = `${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
    if (pipelines.length) markDealWon(deal.id);
    else updateDeal(deal.id, {
      status: "won",
      stageId: "stg-ganho",
      stageName: "Fechado / Ganho",
      probability: 100,
      wonAt: nowFormatted,
      lostAt: undefined,
      lossReason: undefined,
      lossNote: undefined,
    });
    toast(`🎉 Parabéns! Negócio "${deal.name}" marcado como GANHO!`);
  };

  const handleArchiveSingleDeal = (deal: DealItem) => {
    archiveDeal(deal.id);
    toast(`Negócio "${deal.name}" arquivado com sucesso.`);
  };

  // Bulk Action Handlers
  const handleBulkUpdateStage = (
    stageId: string,
    stageName: string,
    probability: number
  ) => {
    selectedDealIds.forEach((id) => pipelines.length ? moveDealStage(id, activePipeline.id, stageId, "Movimentação em massa") : updateDeal(id, { pipelineId: activePipeline.id, pipelineName: activePipeline.name, stageId, stageName, probability }));
    toast(`${selectedDealIds.length} negócios movidos para "${stageName}".`);
    setSelectedDealIds([]);
  };

  const handleBulkUpdateOwner = (ownerId: string, ownerName: string) => {
    selectedDealIds.forEach((id) => {
      updateDeal(id, {
        ownerId,
        ownerName,
      });
    });
    toast(`${selectedDealIds.length} negócios atribuídos a ${ownerName}.`);
    setSelectedDealIds([]);
  };

  const handleBulkArchive = () => {
    const count = selectedDealIds.length;
    bulkArchiveDeals(selectedDealIds);
    toast(`${count} negócios arquivados com sucesso!`);
    setSelectedDealIds([]);
  };

  if (commercialPersistence && !realPipelines.length) {
    return <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><h1 className="text-xl font-black text-slate-900">Nenhum pipeline disponível</h1><p className="mt-2 text-sm text-slate-500">Os pipelines reais da organização ainda estão carregando ou não foram configurados.</p></section>;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header with Title, Pipeline Selector & Primary Actions */}
      <DealsHeader
        activePipeline={activePipeline}
        pipelines={commercialPersistence ? realPipelines : MOCK_PIPELINES}
        onSelectPipeline={(p) => {
          setActivePipeline(p);
          toast(`Funil alterado para: ${p.name}`);
        }}
        viewMode={viewMode}
        onViewModeChange={(mode) => setViewMode(mode)}
        onOpenCreateModal={() => {
          if (commercialPersistence && !realPipelines.length) {
            toast("Aguarde o carregamento dos pipelines reais.");
            return;
          }
          setDealToEdit(null);
          setInitialStageForCreate(null);
          setIsFormModalOpen(true);
        }}
        onOpenPipelineConfig={() => setIsPipelineConfigOpen(true)}
      />

      {/* 2. Top Metrics KPIs Bar */}
      <DealsMetrics
        deals={deals}
        activePipeline={activePipeline}
        currentPeriod={currentPeriod}
      />

      {/* 3. Search & Filters Bar */}
      <DealsFilters
        filters={filters}
        onChangeFilters={(f) => setFilters(f)}
        availableOwners={ownerOptions}
        availableCompanies={companies}
        availableTags={availableTags}
      />

      {/* 4. Main View Component: Kanban or Table */}
      {viewMode === "kanban" ? (
        <DealsKanban
          pipeline={activePipeline}
          deals={filteredDeals}
          onUpdateDealStage={handleUpdateDealStage}
          onOpenDetail={(deal) => setSelectedDetailDeal(deal)}
          onOpenCreateInStage={(stage) => {
            setDealToEdit(null);
            setInitialStageForCreate(stage);
            setIsFormModalOpen(true);
          }}
        />
      ) : (
        <DealsTable
          deals={filteredDeals}
          onOpenDetail={(deal) => setSelectedDetailDeal(deal)}
          onEditDeal={(deal) => {
            setDealToEdit(deal);
            setIsFormModalOpen(true);
          }}
          onMarkWon={handleMarkWon}
          onMarkLost={(deal) => setMarkLostDeal(deal)}
          onReopen={(deal) => setReopenDealItem(deal)}
          onArchiveDeal={handleArchiveSingleDeal}
          selectedIds={selectedDealIds}
          onToggleSelect={(id) => {
            setSelectedDealIds((prev) =>
              prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
            );
          }}
          onSelectAll={(ids) => setSelectedDealIds(ids)}
        />
      )}

      {/* Bulk Actions Floating Bar */}
      <DealsBulkActions
        selectedCount={selectedDealIds.length}
        onClearSelection={() => setSelectedDealIds([])}
        onBulkUpdateStage={handleBulkUpdateStage}
        onBulkUpdateOwner={handleBulkUpdateOwner}
        onBulkArchive={handleBulkArchive}
        availableStages={activePipeline.stages}
        availableOwners={ownerOptions}
      />

      {/* MODALS & DRAWERS */}
      {/* Create / Edit Deal Form Modal */}
      <DealFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        dealToEdit={dealToEdit}
        initialStage={initialStageForCreate}
        initialPipeline={activePipeline}
        availableCompanies={companies}
        availableContacts={contacts}
        availableOwners={ownerOptions}
        availablePipelines={commercialPersistence ? realPipelines : MOCK_PIPELINES}
        onSave={handleSaveDeal}
      />

      {/* Mark Lost Modal */}
      <MarkLostModal
        isOpen={Boolean(markLostDeal)}
        onClose={() => setMarkLostDeal(null)}
        deal={markLostDeal}
        onConfirm={handleConfirmMarkLost}
      />

      {/* Reopen Deal Modal */}
      <ReopenDealModal
        isOpen={Boolean(reopenDealItem)}
        onClose={() => setReopenDealItem(null)}
        deal={reopenDealItem}
        availablePipelines={commercialPersistence ? realPipelines : MOCK_PIPELINES}
        onConfirm={handleConfirmReopen}
      />

      {/* Pipeline Config Preview Modal */}
      <PipelineConfigPreviewModal
        isOpen={isPipelineConfigOpen}
        onClose={() => setIsPipelineConfigOpen(false)}
        pipelines={commercialPersistence ? realPipelines : MOCK_PIPELINES}
      />

      {/* 360° Detail Drawer */}
      <DealDetailDrawer
        isOpen={Boolean(selectedDetailDeal)}
        onClose={() => setSelectedDetailDeal(null)}
        deal={selectedDetailDeal}
        onEditDeal={(d) => {
          setSelectedDetailDeal(null);
          setDealToEdit(d);
          setIsFormModalOpen(true);
        }}
        onMarkWon={handleMarkWon}
        onMarkLost={(d) => {
          setSelectedDetailDeal(null);
          setMarkLostDeal(d);
        }}
        onReopen={(d) => {
          setSelectedDetailDeal(null);
          setReopenDealItem(d);
        }}
        onArchiveDeal={handleArchiveSingleDeal}
      />
    </div>
  );
};
