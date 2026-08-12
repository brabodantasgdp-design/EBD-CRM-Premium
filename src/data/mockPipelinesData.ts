export interface PipelineStageConfig {
  id: string;
  pipelineId: string;
  name: string;
  order: number;
  probability: number; // Percentage 0-100
  color: string; // Tailwind color class or hex
}

export interface PipelineConfig {
  id: string;
  name: string;
  description: string;
  isDefault?: boolean;
  stages: PipelineStageConfig[];
}

export const MOCK_PIPELINES: PipelineConfig[] = [
  {
    id: "pipe-b2b",
    name: "Vendas B2B Complexas",
    description: "Funil principal de prospecção e fechamento de grandes contas.",
    isDefault: true,
    stages: [
      {
        id: "stg-qual",
        pipelineId: "pipe-b2b",
        name: "Qualificação",
        order: 1,
        probability: 20,
        color: "slate",
      },
      {
        id: "stg-diag",
        pipelineId: "pipe-b2b",
        name: "Diagnóstico",
        order: 2,
        probability: 40,
        color: "blue",
      },
      {
        id: "stg-prop",
        pipelineId: "pipe-b2b",
        name: "Proposta",
        order: 3,
        probability: 60,
        color: "indigo",
      },
      {
        id: "stg-neg",
        pipelineId: "pipe-b2b",
        name: "Negociação",
        order: 4,
        probability: 80,
        color: "amber",
      },
      {
        id: "stg-close",
        pipelineId: "pipe-b2b",
        name: "Fechamento",
        order: 5,
        probability: 90,
        color: "emerald",
      },
    ],
  },
  {
    id: "pipe-renewals",
    name: "Renovações & Expansão",
    description: "Gestão de renovação de contratos e expansão de contas ativas.",
    isDefault: false,
    stages: [
      {
        id: "stg-ren-id",
        pipelineId: "pipe-renewals",
        name: "Identificação",
        order: 1,
        probability: 25,
        color: "sky",
      },
      {
        id: "stg-ren-rev",
        pipelineId: "pipe-renewals",
        name: "Revisão de Conta",
        order: 2,
        probability: 50,
        color: "violet",
      },
      {
        id: "stg-ren-prop",
        pipelineId: "pipe-renewals",
        name: "Proposta de Renovação",
        order: 3,
        probability: 75,
        color: "purple",
      },
      {
        id: "stg-ren-neg",
        pipelineId: "pipe-renewals",
        name: "Negociação",
        order: 4,
        probability: 85,
        color: "amber",
      },
      {
        id: "stg-ren-done",
        pipelineId: "pipe-renewals",
        name: "Renovado",
        order: 5,
        probability: 95,
        color: "emerald",
      },
    ],
  },
];

export const MOCK_LOSS_REASONS = [
  "Preço / Orçamento fora de escopo",
  "Escolheu concorrente",
  "Sem orçamento aprovado",
  "Timing inadequado / Adiado",
  "Sem decisão / Projeto cancelado",
  "Perda de contato / Ghosting",
  "Falta de aderência técnica / Sem fit",
  "Outro motivo",
];
