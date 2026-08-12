# Checklist manual — Auth browser — Fase 05

Deployment: `https://crmpro-r9x0k2hig-gestao-de-sistema.vercel.app`

Executar com o bypass de Protection configurado no navegador/ambiente autorizado. Não registrar cookies, JWTs ou senhas.

- [ ] Abrir o deployment e confirmar que aparece o Nexus CRM, não a tela SSO da Vercel.
- [ ] Login Owner A pela UI.
- [ ] Atualizar o Dashboard.
- [ ] Abrir Leads e atualizar a página.
- [ ] Trocar Org A → Org C.
- [ ] Atualizar mantendo Org C.
- [ ] Voltar Org C → Org A.
- [ ] Fazer logout.
- [ ] Usar voltar/atualizar e confirmar que a sessão não retorna.
- [ ] Login Owner B e confirmar apenas Org B.
- [ ] Repetir em viewport mobile de 390px e verificar ausência de overflow horizontal.

Registrar apenas aprovado/reprovado, viewport e observações visuais. A inspeção técnica de JWT não é necessária.
