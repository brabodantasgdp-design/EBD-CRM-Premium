# Scheduler de follow-ups

O endpoint `POST /api/internal/scheduler` é um adaptador server-only para cron externo.
Ele exige `Authorization: Bearer <SCHEDULER_SECRET>` (ou `CRON_SECRET`) e
`x-organization-id`. O cliente com service role é criado somente dentro do
handler do servidor; nenhuma chave é enviada ao navegador ou incluída em
`NEXT_PUBLIC_*`.

Em produção self-hosted, um cron Docker/VPS pode chamar o endpoint por
organização a cada minuto. O processamento é limitado a itens vencidos sem
`processed_at`, marca cada item uma única vez e pode ser movido para um worker
dedicado sem alterar o contrato HTTP.
