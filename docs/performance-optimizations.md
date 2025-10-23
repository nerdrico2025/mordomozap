# Otimizações de Performance: travamentos e lentidão

Este documento resume causas, correções aplicadas e resultados observados para os problemas de travamento e lentidão nas páginas da aplicação.

## Sintomas
- Congelamento ocasional ao navegar entre rotas e abrir listas grandes.
- Lentidão ao carregar conversas e mensagens longas.
- Logs de desenvolvimento com `net::ERR_ABORTED` durante HMR (esperado em ambiente dev quando há navegação e hot reload).
- Erros recorrentes de proxy `/api/uaz/reconnect` por credenciais ausentes, gerando tentativas desnecessárias.

## Causas identificadas
- Carregamento inicial pesado (todas as rotas importadas eagerly).
- Consultas ao banco com `select(*)` e sem limites, retornando payloads desnecessários.
- Renderização de listas longas sem paginação (Conversas) e sem memoização (Mensagens).
- Mídia carregada de forma síncrona no chat, ocupando banda e CPU.
- Auto-reconnect do WhatsApp disparado sem credenciais, gerando erros e ruído de logs.

## Correções implementadas
1. Code splitting em rotas pesadas
   - App.tsx: substituição de imports por `React.lazy` e `Suspense` com fallback visual.
   - Redução do bundle inicial e melhoria no First Paint.

2. Paginação e consultas otimizadas
   - `chatService.getConversations(companyId, page, pageSize)`: seleção de colunas (`id, customer_name, customer_phone, started_at, status`) e `range` paginado (20 itens/req).
   - `chatService.getMessages(conversationId, page, pageSize)`: seleção de colunas (`id, conversation_id, direction, text, timestamp, payload_json`) e `range` paginado (100 itens/req).
   - Menor volume de dados por requisição e menor uso de memória.

3. Listagem de conversas com paginação
   - `ConversationsPage`: estado de `page`, `hasMore`, botão “Carregar mais” e tratamento de erros via `useFeedback`.
   - Carga inicial mais rápida e melhor responsividade em listas grandes.

4. Renderização do chat mais leve
   - `ChatMessage`: `React.memo` com comparação leve por `id/text/payload_url/direction`.
   - Mídia com `loading="lazy"/decoding="async"` em imagens e `preload="metadata"` em vídeos.
   - Menos re-renderizações e menor uso de CPU ao rolar o chat.

5. WhatsApp Connection (já aplicado anteriormente)
   - Polling reduzido (10s), `mountedRef` para evitar setState após unmount, e guarda de credenciais para não tentar `/reconnect` sem `api_key`.

## Testes e validação
- Prévia de produção: `vite preview` em `http://localhost:4324/#/conversations` sem erros em navegador.
- Dev server: `npm run dev` em porta alternativa; HMR funcionando. `ERR_ABORTED` em dev é esperado em navegações/hot reloads.
- Comportamento esperado:
  - Conversas: primeira página carrega rapidamente; botão “Carregar mais” adiciona itens sem travar UI.
  - Chat: imagens e vídeos só carregam quando necessários; rolagem permanece fluida.
  - Rotas: fallback “Carregando tela...” exibido até que o chunk seja carregado.

## Resultados (estimados)
- Bundle inicial menor (rotas pesadas carregadas sob demanda).
- Redução de payload nas consultas de conversas/mensagens (colunas específicas + paginação).
- Menos re-renderizações de mensagens e menor uso de banda em mídia.
- Diminuição de ruído de logs no auto-reconnect do WhatsApp.

## Próximos passos
- Adicionar medição objetiva (LCP/TTI) com Lighthouse e registrar comparativos.
- Virtualização de listas (ex.: `react-window`) para conversas e mensagens muito longas.
- Ajustar pageSize por dispositivo (mobile vs desktop) para melhor UX.
- Monitorar recursos do navegador (DevTools: Performance/Memory) em rotas críticas.