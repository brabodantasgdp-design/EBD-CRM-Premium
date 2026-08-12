import React, { useState } from "react";
import { LeadItem } from "../../types/crm";
import { LeadStatusBadge } from "./LeadStatusBadge";
import { LeadScoreBadge } from "./LeadScoreBadge";
import {
  Building2,
  Calendar,
  MoreVertical,
  Eye,
  Edit3,
  ArrowUpRight,
  XCircle,
  Clock,
  ShieldCheck,
} from "lucide-react";

interface LeadCardProps {
  lead: LeadItem;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onOpenDetail: (lead: LeadItem) => void;
  onOpenEdit: (lead: LeadItem) => void;
  onOpenConvert: (lead: LeadItem) => void;
  onOpenDisqualify: (lead: LeadItem) => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  isSelected,
  onToggleSelect,
  onOpenDetail,
  onOpenEdit,
  onOpenConvert,
  onOpenDisqualify,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      onClick={() => onOpenDetail(lead)}
      className={`bg-white rounded-2xl p-4 border transition-all duration-200 cursor-pointer relative shadow-2xs hover:shadow-md flex flex-col justify-between ${
        isSelected
          ? "border-indigo-500 ring-2 ring-indigo-500/10 bg-indigo-50/20"
          : "border-slate-200/80 hover:border-slate-300"
      }`}
    >
      {/* Top Row: Checkbox, Name, Status & Context Menu */}
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(lead.id)}
              onClick={(e) => e.stopPropagation()}
              className="h-4 w-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer shrink-0 mt-0.5"
            />
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-sm leading-snug truncate hover:text-indigo-600 transition-colors">
                {lead.name}
              </h3>
              <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                <span>
                  {lead.company ? `${lead.company} • ` : ""}
                  {lead.jobTitle || "Sem cargo"}
                </span>
              </p>
            </div>
          </div>

          {/* Context Menu Button */}
          <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Ações do lead"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-40 text-xs">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenDetail(lead);
                    }}
                    className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                  >
                    <Eye className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Ver detalhes</span>
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenEdit(lead);
                    }}
                    className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-slate-500" />
                    <span>Editar lead</span>
                  </button>
                  {lead.status !== "converted" ? (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenConvert(lead);
                      }}
                      className="w-full text-left px-3 py-2 text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 font-medium"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Converter</span>
                    </button>
                  ) : (
                    <div
                      className="w-full text-left px-3 py-2 text-slate-400 bg-slate-50 flex items-center gap-2 font-medium cursor-not-allowed opacity-75"
                      title="Este lead já foi convertido"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Lead Convertido</span>
                    </div>
                  )}
                  {lead.status !== "disqualified" && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenDisqualify(lead);
                      }}
                      className="w-full text-left px-3 py-2 text-rose-700 hover:bg-rose-50 flex items-center gap-2 font-medium"
                    >
                      <XCircle className="h-3.5 w-3.5 text-rose-600" />
                      <span>Desqualificar</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Badges Row */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <LeadStatusBadge status={lead.status} />
          <LeadScoreBadge score={lead.score} />
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
            {lead.source}
          </span>
        </div>
      </div>

      {/* Bottom Info Row */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 gap-2">
        {/* Owner */}
        <div className="flex items-center gap-1.5 min-w-0">
          {lead.ownerAvatar ? (
            <img
              src={lead.ownerAvatar}
              alt={lead.ownerName}
              className="h-4 w-4 rounded-full object-cover shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="h-4 w-4 rounded-full bg-slate-200 text-slate-600 text-[9px] font-bold flex items-center justify-center shrink-0">
              {lead.ownerName.charAt(0)}
            </div>
          )}
          <span className="truncate text-slate-700 font-medium">{lead.ownerName}</span>
        </div>

        {/* Next Task or Last Activity */}
        <div className="text-right shrink-0">
          {lead.nextTaskText && lead.nextTaskText !== "Nenhuma" ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
              <Calendar className="h-3 w-3 shrink-0" />
              <span className="truncate max-w-[120px]">{lead.nextTaskText}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-slate-400">
              <Clock className="h-3 w-3" />
              <span>{lead.lastActivityText}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
