# Copilot BYOK

Em uma instalação self-hosted, gere uma chave mestra aleatória de 32 bytes e defina `AI_CREDENTIALS_ENCRYPTION_KEY` no ambiente do servidor. Essa chave não deve ser publicada, commitada ou prefixada com `NEXT_PUBLIC_`.

Depois, o Owner ou Admin entra em Configurações, escolhe Groq ou Gemini, informa o modelo e a chave da própria organização e usa **Testar conexão** antes de salvar. O Nexus armazena somente a credencial autenticada criptografada e os últimos quatro caracteres. A chave original não é devolvida ao navegador.

`AI_ALLOW_ENV_FALLBACK=true` é opcional para desenvolvimento/homologação. Em produção, o fluxo normal é a credencial BYOK da organização; sem configuração, o Copilot informa que o provider precisa ser configurado.
