# Nexus CRM — Fundação SaaS

Esta fase adiciona a base de identidade e tenancy com Supabase, sem migrar os dados comerciais.

## Configuração local

Copie `.env.example` para `.env.local` e preencha apenas com as credenciais do ambiente Supabase escolhido:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` somente para futuras operações server-only aprovadas

Nenhum valor real deve ser versionado. A migration em `supabase/migrations/` deve ser aplicada pelo Supabase CLI ou pelo pipeline de banco do projeto.

## Escopo atual

- autenticação por senha e recuperação inicial;
- refresh de sessão SSR via `src/middleware.ts`;
- profiles, organizations e organization_members;
- onboarding transacional via `create_initial_organization`;
- cookie HTTP-only de organização ativa, sempre validado contra membership no servidor;
- RLS para impedir acesso anônimo, acesso cross-tenant e autoelevação de role;
- Leads, contatos, empresas, negócios, tarefas e atividades continuam mocks do protótipo.

## Testes reais ainda necessários

Com um projeto Supabase local/remoto configurado, criar dois usuários e duas organizações e executar os casos descritos na especificação da Fase 05: isolamento cross-tenant, acesso anônimo, tentativa de autoelevação e spoofing da organização ativa. Sem essas credenciais, este repositório não declara os testes RLS como executados.
