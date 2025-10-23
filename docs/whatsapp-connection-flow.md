# Fluxo de Conexão do WhatsApp (QR, Status, Erros)

Este documento descreve o fluxo atual de conexão do WhatsApp na aplicação, com ênfase no início manual via QR Code, verificação de status, reconexão condicionada a credenciais e tratamento de erros. O objetivo é impedir tentativas automáticas indevidas que resultem em erros como “Missing credentials”.

## Visão Geral
- Componente de UI: `components/WhatsAppConnection.tsx`
- Serviço frontend: `services/whatsappService.ts`
- Proxy backend (Express): rotas sob `/api/uaz` em `server.ts`
- Tabela: `whatsapp_integrations` (estado, api_key, qr_code_base64, etc.)

## Estados de Conexão
- `connected`: Instância operacional; botão “Desconectar”.
- `pending`: Aguardando escaneamento do QR; exibe QR e realiza polling.
- `disconnected`: Instância desconectada; exibe botão “Conectar WhatsApp”.
- `error`: Alguma falha ocorreu; botão “Tentar Novamente”.

## Fluxo do Usuário
1. Verificar status
   - Ao abrir a aba de Integrações, o app chama `getIntegrationStatus(companyId)`, que consulta `/api/uaz/status`.
   - Se não houver credenciais, o status é tratado como `disconnected`.
2. Aguardar ação do usuário
   - Sem reconexão automática. Interface permanece em `disconnected` até o clique em “Conectar WhatsApp”.
3. Iniciar manualmente via QR Code
   - Botão “Conectar WhatsApp” chama `startConnection(companyId)` → `/api/uaz/start-connection`.
   - O proxy cria/ativa instância na UAZAPI e retorna: `instanceName`, `apiKey` e `qrCodeBase64`.
   - A UI exibe o QR e inicia polling para atualizar o status.
4. Polling enquanto `pending`
   - A cada 10s, `getIntegrationStatus` verifica se a instância ficou `connected`.
   - Ao conectar, interrompe polling e muda a UI para `connected`.
5. Reconexão manual (com credenciais)
   - Botão “Tentar Reconectar” só aparece se `integration.api_key` estiver presente.
   - Ao clicar, `reconnect(companyId)` → `/api/uaz/reconnect` retorna novo QR (`qrCodeBase64`).
6. Desconectar
   - Botão “Desconectar” chama `/api/uaz/disconnect` e zera estado local (DB) para `disconnected`.

## Regras Importantes (anti-“Missing credentials”)
- Nenhuma tentativa de reconexão é feita automaticamente ao carregar a página.
- O botão “Tentar Reconectar” só aparece se `api_key` existir (há credenciais válidas no DB).
- `getIntegrationStatus` trata indisponibilidade do proxy como `disconnected` e limpa credenciais inválidas no DB.
- Polling do QR ocorre somente enquanto o status for `pending`.
- Proteção contra `setState` após unmount via `mountedRef`.

## Endpoints do Proxy (`/api/uaz`)
- `POST /status`
  - Body: `{ companyId }`
  - Resposta: `{ connected: boolean }`
  - Sem token: usa estado do DB; se ausente, retorna `connected: false`.
- `POST /start-connection`
  - Body: `{ companyId }`
  - Resposta: `{ instanceName, apiKey, qrCodeBase64 }`
  - Erros relevantes: `401 Invalid token`, `502 UAZAPI connect failure`, `500 timeout`.
- `POST /reconnect`
  - Body: `{ companyId }`
  - Requer token válido; se ausente → `404 { error: 'Missing credentials' }` (evitado na UI).
  - Resposta: `{ qrCodeBase64 }`
  - Erros relevantes: `401 Invalid token` (token inválido é limpo no DB), `502`, `500 timeout`.
- `POST /disconnect`
  - Body: `{ companyId }`
  - Tenta `instance/logout` na UAZAPI (se houver token) e zera estado no DB.

## Tratamento de Erros (UI)
- “Informações da empresa não encontradas…”: impede iniciar sem `company_id`.
- “QR Code não retornado…” ou timeouts: exibe mensagem e mantém estado coerente.
- “Token inválido”: proxy limpa token no DB e a UI orienta a nova conexão via QR.
- “Credenciais não encontradas. Inicie uma nova conexão via QR Code.”: exibida ao tentar reconectar sem `api_key`.

## Decisões de Implementação
- Removido auto-reconnect no componente; reconexão passa a ser ação explícita do usuário.
- Polling reduzido para 10s, apenas no estado `pending`.
- `mountedRef` evita chamadas `setState` após unmount.
- Botões condicionais:
  - “Conectar WhatsApp”: sempre exibido quando não conectado.
  - “Tentar Reconectar”: exibido somente se `api_key` existir.

## Testes Manuais Sugeridos
1. Com DB sem credenciais: abrir Integrações → ver `disconnected` e nenhum auto-reconnect.
2. Clicar “Conectar WhatsApp”: ver QR e mensagens de orientação; polling ativo.
3. Simular conexão concluída: status muda para `connected` e polling para.
4. Limpar token/invalidar via proxy: verificar que status cai para `disconnected` e UI pede nova conexão.
5. Com `api_key` válida e status `disconnected`: checar se “Tentar Reconectar” aparece; ao clicar, novo QR é exibido.
6. Desconectar: botão encerra sessão e zera estado.

## Referências de Código
- UI: `components/WhatsAppConnection.tsx`
- Serviço: `services/whatsappService.ts`
- Proxy: `server.ts` (rotas `/status`, `/start-connection`, `/reconnect`, `/disconnect`)