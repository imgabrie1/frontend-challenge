# 📋 Plano de Ação — Marketplace de NFTs

> **Documento vivo de acompanhamento e guia de continuidade para agentes e desenvolvedores.**  
> Atualizado em: 31 de Outubro de 2026 — 16:41.

---

## 📌 Contexto & Status Geral

Este projeto é uma implementação completa do **NFT Marketplace** em React 19 + TypeScript baseada na stack obrigatória especificada em [`PROJECT-README.md`](file:///home/gabriel/jungle-gaming/frontend-challenge/PROJECT-README.md):
- **Interface & Componentes**: React 19, Tailwind CSS v4, shadcn/ui
- **Roteamento**: TanStack Router (file-based routing em `apps/web/src/routes`)
- **Estado Remoto & Cache**: TanStack Query v5 (`@tanstack/react-query`)
- **Transporte HTTP**: Axios com interceptores de auth (`apps/web/src/lib/axios.ts`)
- **Mocks & Simulação**: Mock Service Worker (MSW v2) com banco in-memory persistente em LocalStorage (`apps/web/src/mocks/db`)
- **Tempo Real**: Socket.IO client conectado ao MSW via `@mswjs/socket.io-binding`
- **Testes & Qualidade**: Playwright (12 suítes E2E + regressão visual) e Lighthouse

---

## 🎯 Divisão de Responsabilidades

| Responsabilidade | Responsável | Status |
|---|---|---|
| Implementação de Telas e Fluxos | Agente IA | ✅ Concluído |
| Ajustes de Fluxo, Sessão, Estoque e Tempo Real | Agente IA | ✅ Concluído |
| Auditoria Automatizada Lighthouse | Agente IA | ✅ Concluído |
| Execução e Validação dos Testes E2E (Playwright) | Agente IA | ✅ **Concluído — 52/52 testes passando** |
| Deploy em Produção (Vercel / Netlify / Cloudflare) | **Usuário** | 👤 Reservado ao usuário |

---

## 📊 Matriz de Tarefas

### 🟢 Fase 1: Telas e Fluxos Centrais (Concluído)
- [x] **Catálogo & Busca**: Filtros combináveis (categoria, rede, preço, ordenação), paginação orientada à URL (`/?page=...&sortBy=...`).
- [x] **Detalhes do NFT**: Galeria de imagens, seleção de edições, controle de quantidade e verificação de estoque.
- [x] **Carrinho**: Adicionar, atualizar quantidades, remover, cupons de desconto (`SAVE10`, `SAVE20`), cálculo de subtotal, desconto e taxa de rede.
- [x] **Checkout & Pagamento**: Seleção de carteiras cadastradas, toggle de conexão de carteira simulada, revisão de termos com idempotência de compra (`idempotencyKey`).
- [x] **Confirmação de Pedido**: Snapshot imutável do recibo (`/orders/$id`), status pendente, confirmado e recusado com recuperação pós-refresh.
- [x] **Tela de Favoritos (`/favorites`)**: Nova rota criada com cards dos NFTs favoritados, remoção otimista e botão no header apontando para `/favorites`.
- [x] **Sincronização Pós-Compra**:
  - Carrinho é esvaziado otimisticamente logo na confirmação.
  - Estoque (`available`) na home atualizado em tempo real via Socket.IO (`nft.updated`) com patch direto no cache do TanStack Query sem requisição redundante.
  - Se a compra for recusada, o estoque **não** é decrementado indevidamente.

---

### 🟢 Fase 2: Preservação de Contexto e Redirecionamentos (Concluído)
- [x] **Preservação de Redirect no Login/Cadastro**:
  - Rotas protegidas (`/checkout`, `/profile`, `/wallets`, `/favorites`) passam `search={{ redirect: '...' }}` ao direcionar para `/login`.
  - `/register` configurado com `validateSearch` para aceitar `redirect` e navegar de volta à rota pretendida após cadastro.
  - Alternância entre telas de login e cadastro preserva o parâmetro `redirect`.
- [x] **Disponibilidade no Merge de Carrinho de Visitante**:
  - Atualizado `mergeCart` em `apps/web/src/mocks/db/index.ts` para respeitar `edition.available` real do NFT ao consolidar o carrinho de visitante no carrinho do usuário autenticado.

---

### 🟢 Fase 3: Auditoria Lighthouse (Concluído)
- [x] Executada auditoria automatizada via `npm run lighthouse` (3 baterias por página e perfil com cálculo de mediana).
- [x] Relatórios HTML e JSON gerados em `apps/web/lighthouse/reports/`.
- [x] **Resultados Consolidados (Medianas)**:

| Página | Perfil | Performance | Acessibilidade (≥95) | Best Practices (≥95) | SEO (≥90) | LCP | CLS | TBT |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Início (`/`)** | Desktop | **100** | **97** | **100** | **91** | 234 ms | 0.009 | 37 ms |
| **Início (`/`)** | Mobile | **89** | **97** | **100** | **91** | 798 ms | 0 | 449 ms |
| **Detalhe (`/nfts/nft-1`)** | Desktop | **100** | **96** | **100** | **91** | 740 ms | 0 | 9 ms |
| **Detalhe (`/nfts/nft-1`)** | Mobile | **88** | **96** | **100** | **91** | 2983 ms | 0 | 305 ms |

---

### 🟢 Fase 4: Bateria de Testes E2E Playwright (Concluído — 52/52 Verdes)

Executada a suíte completa nos viewports Desktop (1440x900) e Mobile (390x844):
```bash
cd apps/web
VITE_MSW_ENABLED=true npx playwright test
```
**Resultado: 52 passed (100% de sucesso sem nenhuma falha ou retry).**

#### ✅ Correções finais aplicadas:
1. `01-catalog-filters.spec.ts` & `src/features/catalog/CatalogFilters.tsx`: Adicionada barra horizontal de chips de categorias no mobile (`lg:hidden`) e ajustado seletor para pegar o elemento visível e abrir o drawer de rede quando necessário.
2. `06-full-purchase-flow.spec.ts`: Removido clique forçado precoce (`{ force: true }`) no botão "Confirm & Pay" enquanto a cotação recalculava, garantindo que o clique ocorra com o botão habilitado e navegue para o recibo.
3. `12-skeletons-error-recovery.spec.ts`: Ajustado timeout da asserção para 20s para acomodar com folga a política de 3 retries e backoff exponencial do TanStack Query.
4. `src/lib/axios.ts` e `src/hooks/useSocket.ts`: Atualizados `BASE_URL` e `SOCKET_URL` para suportar URLs relativas da mesma origem em deploy de produção sem Mixed Content.
5. `apps/web/vercel.json` e `apps/web/public/_redirects`: Adicionadas regras de rewrite SPA para garantir que refresh e acesso direto funcionem em produção.

#### Lista completa de suítes validadas:
- [x] `01-catalog-filters.spec.ts` ✅ (Desktop & Mobile)
- [x] `02-nft-detail-direct-access.spec.ts` ✅ (Desktop & Mobile)
- [x] `03-auth-flows.spec.ts` ✅ (Desktop & Mobile)
- [x] `04-favorites-optimistic.spec.ts` ✅ (Desktop & Mobile)
- [x] `05-cart-management.spec.ts` ✅ (Desktop & Mobile)
- [x] `06-full-purchase-flow.spec.ts` ✅ (Desktop & Mobile)
- [x] `07-payment-idempotency.spec.ts` ✅ (Desktop & Mobile)
- [x] `08-profile-wallets.spec.ts` ✅ (Desktop & Mobile)
- [x] `09-realtime-checkout.spec.ts` ✅ (Desktop & Mobile)
- [x] `10-event-dedup-reconnect.spec.ts` ✅ (Desktop & Mobile)
- [x] `11-accessibility-keyboard.spec.ts` ✅ (Desktop & Mobile)
- [x] `12-skeletons-error-recovery.spec.ts` ✅ (Desktop & Mobile)

---

### 🚀 Fase 5: Instruções para o Deploy (Ação do Usuário)
*Passos recomendados para quando o usuário for realizar a publicação:*
1. **Build de Produção com Mocks**:
   ```bash
   cd apps/web
   npm run build:demo
   ```
2. **Deploy na Vercel**:
   - Conectar o repositório Git.
   - Definir Root Directory como `apps/web`.
   - Build Command: `npm run build:demo`.
   - Output Directory: `dist`.
   - Environment Variable: `VITE_MSW_ENABLED=true`.
3. **Deploy na Netlify ou Cloudflare Pages**:
   - Configuração análoga apontando a pasta `dist` e garantindo o arquivo `public/mockServiceWorker.js` acessível.
4. **Verificação pós-deploy**:
   - Testar acesso direto a `/checkout`, `/profile`, `/nfts/nft-1`.
   - Testar refresh na página de confirmação de pedido.

---

## 🛠️ Guia para Futuras IAs que Continuarem este Trabalho
1. **Regra de ouro**: O usuário fará o deploy e solicitou deixar os testes E2E por último.
2. **Ambiente com Mocks**: Todo o backend é simulado via MSW (`apps/web/src/mocks`). Não tente conectar a um backend externo.
3. **Persistência Local**: O banco de dados mock armazena estado no `localStorage['msw_db_state']`. O botão flutuante `DevToolbar` no canto inferior direito reseta o banco para o estado original com 1 clique.
4. **Validação de Tipos**: Execute sempre `npm run typecheck` em `apps/web` para garantir conformidade total do TypeScript.
5. **Atualizações**: A cada etapa concluída, atualize a matriz de tarefas neste arquivo.
