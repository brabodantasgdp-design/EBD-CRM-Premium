import { CompanyStatus } from "../types/crm";

export interface CompanyStatusOption {
  id: CompanyStatus;
  label: string;
  badgeClass: string;
  dotClass: string;
  description: string;
}

export const COMPANY_STATUS_CONFIG: Record<CompanyStatus, CompanyStatusOption> = {
  prospect: {
    id: "prospect",
    label: "Prospect",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
    dotClass: "bg-blue-500",
    description: "Conta em prospecção ou oportunidade ativa sem contrato assinado",
  },
  cliente: {
    id: "cliente",
    label: "Cliente",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
    dotClass: "bg-emerald-500",
    description: "Conta ativa com contratos vigentes e faturamento recorrente",
  },
  inativo: {
    id: "inativo",
    label: "Inativo",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
    dotClass: "bg-amber-500",
    description: "Sem interações comerciais ou compras nos últimos 180 dias",
  },
  ex_cliente: {
    id: "ex_cliente",
    label: "Ex-cliente",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100",
    dotClass: "bg-rose-500",
    description: "Contrato encerrado ou encerrado por distrato/cancelamento",
  },
};

export const COMPANY_SEGMENTS = [
  "Tecnologia & SaaS",
  "Logística & Infraestrutura",
  "Transportes & Supply Chain",
  "Manufatura & Indústria",
  "Construção & Engenharia",
  "Varejo & E-commerce",
  "Agronegócio & Insumos",
  "Serviços Financeiros",
  "Saúde & Biotecnologia",
  "Educação & EdTech",
  "Consultoria & Serviços Profissionais",
  "Outro",
];

export const COMPANY_SIZES = [
  "1–10 funcionários",
  "11–50 funcionários",
  "51–100 funcionários",
  "101–250 funcionários",
  "251–500 funcionários",
  "500+ funcionários",
];

export const COMPANY_TAGS = [
  "Enterprise",
  "Estratégica",
  "VIP",
  "Contrato Anual",
  "Internacional",
  "Multinacional",
  "Mid-Market",
  "Startup",
  "Público / Licitação",
  "Parceiro",
];
