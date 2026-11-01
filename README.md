# NFT Marketplace — Solução do Desafio Frontend

Solução completa do marketplace de NFTs desenvolvida em **React 19**, **TypeScript**, **TanStack Router**, **TanStack Query v5**, **Tailwind CSS v4**, **shadcn/ui**, **MSW v2 (Mock Service Worker)** e **Socket.IO**.

Fidelidade visual baseada no [layout do Figma](https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1).

---

## 🌐 Deploy em Produção

- **URL Pública da Aplicação**: `https://<seu-dominio>.vercel.app` *(ou Netlify / Cloudflare Pages)*
- **Repositório**: `https://github.com/<seu-usuario>/frontend-challenge`

> **Nota de Acesso**: A aplicação é 100% autônoma (client-side com mocks MSW). Todas as rotas suportam **acesso direto e refresh** no ambiente de produção graças às regras de rewrite configuradas em [`vercel.json`](file:///home/gabriel/jungle-gaming/frontend-challenge/apps/web/vercel.json) e [`public/_redirects`](file:///home/gabriel/jungle-gaming/frontend-challenge/apps/web/public/_redirects).

---

## ⚙️ Variáveis de Ambiente (`.env`)

Por se tratar de um frontend com simulação completa via MSW no browser do cliente, a configuração de variáveis de ambiente é extremamente simples e direta:

| Variável | Obrigatória? | Padrão | Descrição |
|---|:---:|:---:|---|
| `VITE_MSW_ENABLED` | **Sim (em prod)** | `false` | Ativa o Service Worker do MSW e a simulação de WebSocket. Deve ser `true` tanto em dev quanto no deploy. |
| `VITE_API_URL` | Não | `/api` | Prefixo da API REST. Por padrão usa caminhos relativos na mesma origem interceptados pelo MSW. |
| `VITE_SOCKET_URL` | Não | `window.location.origin` | URL do WebSocket. Por padrão conecta na mesma origem interceptada pelo `@mswjs/socket.io-binding`. |

Exemplo de arquivo `.env` (ou variáveis nas configurações da Vercel / Netlify):
```env
VITE_MSW_ENABLED=true
```

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js ≥ 20.x
- npm ≥ 10.x

### Passo a passo
```bash
# 1. Instalar dependências da raiz do monorepo
npm install

# 2. Iniciar o servidor de desenvolvimento com mocks e tempo real
npm run dev:mock
```
Acesse **`http://localhost:5173`**. O Service Worker do MSW será ativado automaticamente no primeiro carregamento.

---

## 👤 Credenciais Fictícias para Avaliação

A tela de login (`/login`) possui botões de preenchimento automático em 1 clique:

| Usuário | E-mail | Senha | Perfil | Carteiras Cadastradas |
|---|---|---|---|---|
| **Alice Chen** | `alice@nftmarket.dev` | `Alice@123` | Colecionadora & Curadora | `0xd8dA...6045` (Principal) e `0x1234...5678` |
| **Bob Martinez** | `bob@nftmarket.dev` | `Bob@123` | Trader & Desenvolvedor | `0x9876...4321` (Principal) |

> Para testar criação de nova conta, acesse `/register`. O sistema valida campos obrigatórios, força senha forte e trata duplicidade de e-mail/username.

---

## 🛠️ Painel de Simulação de Cenários (`DevToolbar`)

Para que avaliadores possam reproduzir com facilidade os cenários de teste exigidos no edital, incluímos um **painel flutuante no canto inferior direito** da tela (`🛠️ Cenários de Teste`):

1. **⚡ Simular Tempo Real (`nft.updated`)**:
   - Dispara um evento Socket.IO alterando o preço do item `nft-1`.
   - Se o item estiver no catálogo, detalhe, carrinho ou checkout, a interface avisa a alteração e recalcula valores.
2. **💳 Simulação de Pagamento**:
   - Permite forçar o próximo pedido a ser **Sucesso (Confirmado)** ou **Recusado (Falha)**.
3. **🐢 Condições de Rede (MSW)**:
   - Alterna entre latência normal (150ms) e **Lenta (2.5s)** para avaliar skeletons com efeito shimmer e estados de transição.
4. **👤 Alternar Usuário**:
   - Troca instantânea de sessão entre Alice, Bob e Visitante sem deixar lixo no cache.
5. **🔄 Reset Geral de Dados**:
   - Restaura integralmente o banco mock para o estado inicial determinístico.

---

## 💥 Como Reproduzir os Fluxos de Falha

| Cenário de Falha | Como Reproduzir | Comportamento Esperado |
|---|---|---|
| **Pagamento Recusado** | No painel flutuante, selecione *"Simulação de Pagamento: Recusar"*. Finalize uma compra no Checkout. | O recibo exibe tela de transação recusada, mantém itens no carrinho e oferece botão *"Tentar novamente"*. |
| **Preço Alterado durante Checkout** | Coloque o NFT #1 no carrinho e vá para o Checkout. No painel flutuante, clique em *"1. Tempo Real: Simular nft.updated"*. | Um alerta de mudança de preço é exibido no topo e o botão de pagamento bloqueia até nova revisão de valores. |
| **Carteira Desconectada** | No Checkout, na seção *Carteira e rede*, clique em *"Connected (Click to disconnect)"*. | O status muda para desconectado e o botão de pagamento é desabilitado até reconectar. |
| **Cupom Inválido ou Expirado** | No Carrinho, digite `EXPIRED` ou `INVALID99` no campo de cupom. | Exibe mensagem de erro específica (`Este cupom expirou` ou `Cupom inválido. Tente SAVE10 ou SAVE20`). |
| **Conflito de Cadastro** | Acesse `/register` e tente cadastrar com o e-mail `alice@nftmarket.dev`. | Resposta HTTP 409 mapeada com erro inline de validação *"Email already in use"*. |
| **Acesso a NFT Inexistente** | Acesse diretamente `/nfts/nft-99999`. | Exibe tela 404 estilizada com aviso de recurso não encontrado e botão para voltar ao catálogo. |
| **Sessão Expirada** | Abra o console e execute `window.dispatchEvent(new CustomEvent('auth:expired'))`. | A sessão é limpa, queries privadas invalidadas e o usuário é redirecionado para login com preservação de rota (`?redirect=...`). |

---

## 📜 Scripts e Comandos Disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev:mock` | Executa o app em modo de desenvolvimento com mocks e Socket.IO ativos. |
| `npm run build:demo` | Cria o build de produção com os mocks embutidos para deploy público. |
| `npm run preview` | Roda o servidor local para inspecionar o build de produção (`apps/web/dist`). |
| `npm run typecheck` | Executa a validação estrita de tipos do TypeScript (`tsc --noEmit`). |
| `npm run test:e2e` | Executa a suíte completa de 12 testes E2E com Playwright (Desktop e Mobile). |
| `npm run lighthouse` | Executa a auditoria automatizada do Lighthouse (3 baterias, gerando relatórios HTML/JSON). |

---

## 🏆 Resultados das Auditorias Lighthouse

Auditoria executada em build otimizado com 3 medições completas por página e perfil (reportando as medianas):

| Página | Perfil | Performance | Acessibilidade (≥95) | Best Practices (≥95) | SEO (≥90) | LCP | CLS | TBT |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Início (`/`)** | Desktop | **100** | **97** | **100** | **91** | 234 ms | 0.009 | 37 ms |
| **Início (`/`)** | Mobile | **89** | **97** | **100** | **91** | 798 ms | 0 | 449 ms |
| **Detalhe (`/nfts/nft-1`)** | Desktop | **100** | **96** | **100** | **91** | 740 ms | 0 | 9 ms |
| **Detalhe (`/nfts/nft-1`)** | Mobile | **88** | **96** | **100** | **91** | 2983 ms | 0 | 305 ms |

Relatórios HTML e JSON completos versionados em [`apps/web/lighthouse/reports/`](file:///home/gabriel/jungle-gaming/frontend-challenge/apps/web/lighthouse/reports).

---

## 🧪 Cobertura de Testes E2E (Playwright)

As 12 suítes de testes cobrem todos os cenários obrigatórios do edital, tanto em Chromium Desktop (1440x900) quanto em Chromium Mobile (390x844):

1. **`01-catalog-filters.spec.ts`**: Busca, filtros combinados (categoria, rede, preço), ordenação, paginação e restauração pelo histórico do navegador.
2. **`02-nft-detail-direct-access.spec.ts`**: Acesso direto, alternância de edições, galeria de imagens e tratamento de NFT inexistente (404).
3. **`03-auth-flows.spec.ts`**: Cadastro com validações e conflito, login, logout, expiração de sessão e troca limpa de usuário.
4. **`04-favorites-optimistic.spec.ts`**: Favoritos com atualização otimista, rollback em erro e restrição de login.
5. **`05-cart-management.spec.ts`**: Edição de quantidades, remoção, cupons (`SAVE10`, inválido, expirado) e persistência após login e refresh.
6. **`06-full-purchase-flow.spec.ts`**: Fluxo ponta a ponta do catálogo ao recibo confirmado com snapshot imutável.
7. **`07-payment-idempotency.spec.ts`**: Proteção contra cliques repetidos, carteira desconectada e recuperação do pedido por idempotência.
8. **`08-profile-wallets.spec.ts`**: Edição de perfil, bio, alteração de senha com validações e cadastro de carteiras.
9. **`09-realtime-checkout.spec.ts`**: Atualização de preço via Socket.IO em tempo real durante navegação e checkout.
10. **`10-event-dedup-reconnect.spec.ts`**: Descarte de eventos Socket.IO duplicados ou obsoletos e tolerância a quedas de rede.
11. **`11-accessibility-keyboard.spec.ts`**: Navegação por teclado, foco visível e acessibilidade semântica.
12. **`12-skeletons-error-recovery.spec.ts`**: Skeletons com shimmer durante carregamento e botão de retry após erro de rede.

---

## 🏛️ Detalhes Arquiteturais

Para documentação detalhada sobre contratos REST, eventos Socket.IO, política de sessão, reconciliação de cache e decisões de UX, consulte o [`ARCHITECTURE.md`](file:///home/gabriel/jungle-gaming/frontend-challenge/ARCHITECTURE.md).
