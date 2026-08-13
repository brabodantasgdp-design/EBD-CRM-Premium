# QA manual — DnD de Deals — Fase 08

Status: `TEST INFRA` pendente de execução manual.

O fluxo de persistência equivalente ao DnD foi validado pela integração `move_deal_stage` com sessão normal, Deal ID real, alteração de `stage_id`, probabilidade e histórico.

Checklist manual no Preview:

1. Abrir `/negocios` autenticado em desktop.
2. Arrastar um card de uma coluna para outra.
3. Confirmar que o card aparece na coluna de destino.
4. Recarregar a página.
5. Confirmar que o card permanece na coluna de destino.
6. Repetir em viewport mobile, se o controle estiver disponível.

Critério: o DnD só é considerado aprovado quando a mudança visual e a persistência após reload forem observadas no mesmo Deal ID.
