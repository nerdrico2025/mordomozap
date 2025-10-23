# Análise e Correção: Travamento no Login

Este documento registra a análise completa do fluxo de autenticação, as causas prováveis do travamento observado no login, as correções implementadas, e como validar que o problema foi resolvido. Também cobre considerações de front-end/back-end, concorrência no banco e configurações de sessão/cookies.

## Sintomas
- Botão de login ficava indefinidamente em estado de carregamento.
- Redirecionamentos inconsistentes após login (dashboard vs onboarding).
- Em alguns casos, o usuário era deslogado logo após o login.

## Causa Raiz
- No `useAuth`, quando o evento `SIGNED_IN` ocorria e o perfil não estava disponível ainda (delay de replicação ou ausência de trigger de criação), o hook forçava `signOut()`. Isso gerava um estado de corrida onde o login aparentava travar e o usuário era removido do contexto.
- O `LoginPage` controlava o loading apenas localmente, sem levar em conta o `loading` global do contexto de auth — isso contribuía para feedback visual confuso.

## Correções Implementadas
1. Hook `useAuth` (arquivo `hooks/useAuth.tsx`)
   - Removido `signOut()` quando o perfil não está disponível após retentativas.
   - Adicionado fallback de **usuário parcial** (com `id`, `email`, `name` de `user_metadata`) quando o perfil não é encontrado.
   - Mantido `loading=false` após decidir por perfil completo ou parcial, evitando travamento da interface.
   - Comportamento esperado: `PrivateRoute` redireciona para `/onboarding` se `onboarding_completed` estiver ausente/false.

2. Serviço de autenticação (arquivo `services/authService.ts`)
   - `getCurrentUser()` passou a retornar usuário parcial quando o perfil não existe ainda.
   - Mantida tradução de erros de login e signup para mensagens amigáveis.

3. Página de Login (arquivo `pages/LoginPage.tsx`)
   - Botão de submit agora usa `authLoading` do contexto + estado local `submitting`, evitando spinner indefinido.
   - Navegação para `/dashboard` ocorre quando `user` é populado (perfil completo ou parcial), delegando ao `PrivateRoute` o redirecionamento para `/onboarding` quando necessário.

## Melhorias adicionais para estabilidade
- Timeouts de rede no auth:
  - `signIn` e `signUp` protegidos com `withTimeout` de 15s. Mensagem de erro amigável em caso de timeout ou falha de rede.
  - `getCurrentUser` envolve `getUserProfile` com timeout de 8s e aplica fallback para usuário parcial se houver lentidão/falha — evitando travas na tela após login.
- Bloqueio por tentativas excessivas:
  - Após 5 tentativas falhas, o login é bloqueado por 30s (persistência em `sessionStorage`). UI indica contagem regressiva e desabilita o botão.
- Otimização de consulta de perfil:
  - `getUserProfile` agora seleciona apenas colunas necessárias: `id, email, name, onboarding_completed, companies (id, name)`.
- Tratamento de erros aprimorado:
  - Tradução padronizada para mensagens comuns (credenciais inválidas, e-mail já usado, timeout, falha de rede).
  - Log de diagnóstico quando o tempo de login excede 7s (`console.warn`).

## Validação
- Dev Server: `npm run dev` (porta `5173`) ou Preview: `npm run preview` (porta `4322`).
- Acesso: `http://localhost:5173/#/login` ou `http://localhost:4322/#/login`.
- Casos de teste manuais sugeridos:
  - Credenciais válidas: redireciona para `/dashboard` (perfil completo) ou `/onboarding` (fallback parcial), sem travas.
  - Credenciais inválidas: exibe erro "Email ou senha incorretos" e não trava UI.
  - Múltiplas tentativas inválidas (≥5): botão desabilita e mostra contagem regressiva de 30s; após expirar, volta ao normal.
  - Simular rede lenta/instável (ou desligar internet): UI exibe mensagem de falha/timeout amigável e nunca fica indefinidamente em loading.

## Frontend/Backend Blocks
- Frontend: bloqueios eram causados pelo `signOut()` automático no hook; removido.
- Backend: não há uso de cookies/sessão no `server.ts` relacionados ao login (autenticação é client-side via Supabase). As rotas Express são para integrações (WhatsApp/UAZ) e não interferem no fluxo de login.

## Concorrência / Deadlocks no Banco
- As operações no Supabase (auth e profile) são simples `select/update`. Não foi identificado padrão de deadlock.
- O problema de perfil inexistente decorre mais de **delay de replicação** ou de ausência de trigger de criação automática do registro na tabela `users` após signup.
- Ação recomendada: garantir um trigger/edge function que crie o registro em `users` ao finalizar `signUp`. O arquivo `supabase/fix_user_creation_trigger.sql` deve conter essa lógica; verifique no painel do Supabase se o trigger está ativo.

## Sessão/Cookies
- Configuração atual (`services/supabaseClient.ts`):
  - `persistSession: true` e `autoRefreshToken: true` — sessão é persistida em `localStorage` pelo Supabase JS.
  - Não há cookies de autenticação do lado do backend.
- Observação de segurança: o uso de `service_role` no frontend é **inseguro** e só foi adotado para contornar problemas em preview. Em produção, utilize **anon key** e mova operações privilegiadas para um backend seguro.

## Checklist de Conclusão
- [x] Revisar hook `useAuth` e remover logout forçado.
- [x] Adicionar fallback de usuário parcial no `useAuth`.
- [x] Ajustar `authService.getCurrentUser()` para retornar usuário parcial.
- [x] Atualizar `LoginPage` para usar `authLoading` e evitar spinner indefinido.
- [x] Documentar análise, causa raiz e correções.
- [x] Validar UI no dev server.
- [x] Adicionar timeouts no auth e otimizar consulta de perfil.
- [x] Implementar bloqueio temporário após tentativas excessivas.

## Próximos Passos (Recomendado)
- Implementar/validar trigger de criação de perfil em `users` no Supabase.
- Trocar `service_role` por `anon key` no cliente público em produção.
- Adicionar um toast ou aviso claro na onboarding quando o perfil for parcial e ainda estiver sendo concluído.