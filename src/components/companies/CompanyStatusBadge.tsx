import React from "react";
import { CompanyStatus } from "../../types/crm";
import { COMPANY_STATUS_CONFIG } from "../../constants/companyStatus";

interface CompanyStatusBadgeProps {
  status: CompanyStatus;
  showDot?: boolean;
  className?: string;
}

export const CompanyStatusBadge: React.FC<CompanyStatusBadgeProps> = ({
  status,
  showDot = true,
  className = "",
}) => {
  const config = COMPANY_STATUS_CONFIG[status] || COMPANY_STATUS_CONFIG.prospect;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${config.badgeClass} ${className}`}
      title={config.description}
    >
      {showDot && <span className={`h-1.5 w-1.5 rounded-full ${config.dotClass}`} />}
      <span>{config.label}</span>
    </span>
  );
};
