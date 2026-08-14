# Copilot em instalação self-hosted

O Copilot usa um provider server-side configurável. A implementação suporta
Gemini via `@google/genai` e Groq via sua API compatível com OpenAI. A instalação
deve definir:

- `AI_PROVIDER=gemini`
- `AI_MODEL=gemini-2.0-flash` (ou outro modelo compatível)
- `GEMINI_API_KEY` somente no ambiente do servidor

Para Groq:

- `AI_PROVIDER=groq`
- `AI_MODEL=llama-3.3-70b-versatile` (ou outro modelo suportado pela conta)
- `GROQ_API_KEY` somente no ambiente do servidor

Nenhuma dessas variáveis deve usar o prefixo `NEXT_PUBLIC_`. A chave nunca é
enviada ao navegador, registrada em logs ou persistida no banco.

O endpoint `/api/copilot` limita o uso a 10 chamadas por usuário/organização
por minuto, aplica timeout de 20 segundos e registra apenas provider, modelo,
latência, status e fontes do contexto. Prompts crus não são armazenados por
padrão.

Para trocar de provider, implemente `AIProvider` em `src/lib/ai/provider.ts` e
selecione-o por `AI_PROVIDER`, mantendo o contrato `generateText`. A instalação
self-hosted não depende de Vercel AI Gateway, Vercel Cron ou runtime Edge.
