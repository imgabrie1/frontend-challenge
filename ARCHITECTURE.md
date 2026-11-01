# Architecture Documentation — NFT Marketplace

This document details the architectural decisions, design patterns, state management strategies, real-time protocols, and network resilience mechanisms implemented in the NFT Marketplace solution.

---

## 1. Architectural Overview & Monorepo Structure

The project is structured as a scalable monorepo hosting the web client application with full offline and local mock capabilities:

```
frontend-challenge/
├── apps/
│   └── web/
│       ├── public/                     # Static assets & MSW Service Worker
│       ├── src/
│       │   ├── components/             # Reusable accessible UI primitives (shadcn/ui style)
│       │   │   ├── ui/                 # Button, Input, Card, Skeleton, Toaster, etc.
│       │   │   ├── Header.tsx          # Responsive navigation & session controls
│       │   │   └── Pagination.tsx      # Accessible URL-driven pagination
│       │   ├── features/               # Domain-specific components
│       │   │   └── catalog/            # NFTCard, CatalogFilters, Skeletons
│       │   ├── hooks/                  # Global application hooks
│       │   │   ├── useSession.tsx      # Reactive session & auth context
│       │   │   └── useSocket.ts        # Real-time WebSocket subscriptions & deduplication
│       │   ├── lib/                    # HTTP client, TanStack Query client, utilities
│       │   │   ├── axios.ts            # Axios instance with interceptors
│       │   │   ├── query-client.ts     # TanStack Query client & caching policies
│       │   │   └── utils.ts            # Formatting, ETH math & crypto utilities
│       │   ├── mocks/                  # MSW layer (Mock Service Worker)
│       │   │   ├── db/                 # In-memory reactive database with LocalStorage persistence
│       │   │   ├── handlers/           # REST endpoints & Socket.IO mock handlers
│       │   │   └── browser.ts          # MSW browser worker bootstrap
│       │   ├── routes/                 # File-based routing with TanStack Router
│       │   ├── services/               # Strongly-typed REST API service client functions
│       │   └── types/                  # Domain contracts and DTO interfaces
│       ├── tests/                      # Playwright E2E and Visual Regression test suites
│       └── lighthouse/                 # Lighthouse runner and automated audit configuration
├── ARCHITECTURE.md                     # Architectural documentation
├── package.json                        # Monorepo root workspace orchestrator
└── README.md                           # Quickstart guide, environment and scenario reproduction
```

---

## 2. Remote State & Caching Strategy (TanStack Query)

Remote data fetching, caching, synchronization, and optimistic updates are managed exclusively via **TanStack Query (v5)**:

### 2.1 Cache Timing & Garbage Collection
- **`staleTime: 60_000` (1 minute)**: Queries remain fresh for 60 seconds unless explicitly invalidated by mutations or Socket.IO events. This prevents redundant requests while user navigates back and forth between catalog and details.
- **`gcTime: 300_000` (5 minutes)**: Inactive cache entries are retained in memory for 5 minutes, allowing instantaneous back-navigation without layout shift.

### 2.2 Retry Policies & Error Boundaries
- **4xx Errors (Client Errors)**: Automated retries are suppressed for status codes in the 400–499 range (e.g., 401 Unauthorized, 404 Not Found, 409 Conflict, 422 Validation Error).
- **Transient Failures (5xx / Network Drops)**: Automatically retried up to 2 times with exponential backoff (`Math.min(1000 * 2 ** attempt, 30_000)`).
- **Mutations**: Mutations do not retry automatically to prevent accidental double-submits.

### 2.3 Optimistic Updates & Rollback
Implemented in high-frequency interactive actions:
- **Favorite Toggle**:
  1. Cancels outgoing queries for `['nfts']` to prevent race conditions.
  2. Snapshots previous cache state.
  3. Optimistically flips `isFavorited` on the target NFT across catalog lists and detail views.
  4. On server error, rolls back the cache to the snapshot and surfaces an accessible toast error.
  5. Settles by invalidating the query to ensure eventual consistency with the database.

---

## 3. Real-Time Architecture with Socket.IO

Real-time synchronization uses `socket.io-client` bound to Mock Service Worker via `@mswjs/socket.io-binding` and MSW's native `ws.link`:

### 3.1 Supported Events
1. **`nft.updated`**:
   - Carries `{ nftId, version, changes: { price, available, editionId } }`.
   - Invalidates `['nfts']`, `['nfts', nftId]`, `['cart']`, and `['quote']`.
   - Forces checkout and cart screens to refresh quotes and alert the user if a price or edition stock changed in real-time.
2. **`order.updated`**:
   - Carries `{ orderId, userId, version, status, transactionHash }`.
   - Filtered so that only orders belonging to the currently authenticated session trigger UI updates.
   - Transitions pending transactions to `confirmed` or `declined`.

### 3.2 Event Versioning & Deduplication
To guard against stale or duplicate out-of-order WebSocket packets:
- A local registry (`nftVersionsRef` and `orderVersionsRef`) tracks the highest sequence number / version seen for each resource.
- Packets with `event.version <= current_version` are safely discarded without re-triggering query invalidations or state regressions.

### 3.3 Reconnection Reconciliation
Upon network disconnection and subsequent `reconnect`:
- The client dispatches a complete reconciliation cycle by invalidating all active catalog, cart, and order queries, querying the REST endpoints for canonical server state.

---

## 4. Cart & Idempotent Checkout Architecture

### 4.1 Guest vs. Authenticated Cart State
- **Guest Visitor**: Cart items are persisted in local storage (`guestCart`).
- **Upon Authentication**: During login or registration, the application triggers a cart merge (`/api/cart/merge`), consolidating guest items into the user's permanent server cart while respecting max stock limits.
- **Precision Arithmetic**: Prices in ETH are stored and transmitted as decimal strings (e.g. `"0.050000"`) and calculated with fixed 6-decimal floating/BigInt precision (`formatEth`, `addEth`) to prevent standard IEEE-754 floating-point inaccuracies.

### 4.2 Idempotent Order Creation
- Every checkout attempt generates a cryptographic UUIDv4 / timestamped idempotency key (`idempotencyKey`).
- If a network timeout occurs or the user clicks submit multiple times in rapid succession, the backend uses the idempotency key to return the exact same in-flight or created order rather than creating duplicate orders.
- If the price shifts between initial quote and confirmation, the backend responds with HTTP 409 `PRICE_CHANGED`, requiring explicit user re-acknowledgement.

---

## 5. REST Contracts Specification

| Endpoint | Method | Status Codes | Description |
|---|---|---|---|
| `/api/auth/register` | `POST` | 201, 409, 422 | Register user; returns user object + session token |
| `/api/auth/login` | `POST` | 200, 401 | Authenticate credentials; returns user + token |
| `/api/auth/session` | `GET` | 200, 401 | Retrieve currently authenticated session |
| `/api/auth/logout` | `POST` | 200 | Invalidate session |
| `/api/nfts` | `GET` | 200 | List NFTs with search, category, network, price, sorting & pagination |
| `/api/nfts/:id` | `GET` | 200, 404 | Retrieve single NFT with full edition list and images |
| `/api/favorites` | `GET`, `POST`, `DELETE` | 200, 401 | Manage authenticated user favorites |
| `/api/cart` | `GET` | 200 | Retrieve current cart items |
| `/api/cart/items` | `POST` | 200, 404, 409 | Add edition to cart with stock validation |
| `/api/cart/items/:id/:ed`| `PATCH`, `DELETE` | 200, 404 | Modify quantity or remove edition from cart |
| `/api/cart/coupon` | `POST`, `DELETE` | 200, 422 | Apply or remove coupon (`SAVE10`, `SAVE20`) |
| `/api/cart/merge` | `POST` | 200, 401 | Merge guest cart into user cart |
| `/api/quote` | `POST` | 200 | Calculate subtotal, discount, network fees & total in ETH |
| `/api/orders` | `POST` | 202, 401, 404, 409 | Create idempotent order with price revalidation |
| `/api/orders/:id` | `GET` | 200, 401, 403, 404| Retrieve immutable snapshot receipt of an order |
| `/api/profile` | `GET`, `PUT` | 200, 401, 409 | View or update collector details |
| `/api/profile/password`| `POST` | 200, 401, 422 | Change account password with verification |
| `/api/profile/avatar` | `POST` | 200, 401 | Upload and update avatar |
| `/api/wallets` | `GET`, `POST` | 200, 201, 401 | List or register primary/secondary Web3 wallets |
| `/api/wallets/:id` | `PUT` | 200, 401, 404 | Update wallet label, role or network |

---

## 6. Accessibility & UX Principles

1. **Semantic Structure**: Proper Landmark elements (`header`, `main`, `nav`, `section`, `article`, `dl`, `dt`, `dd`).
2. **Accessible Forms**: Associated labels via `htmlFor`, error messages linked with `aria-describedby` and `aria-invalid`.
3. **Keyboard Focus & Operability**: Visible focus rings (`focus-visible:ring-2 focus-visible:ring-primary`), accessible tablists and radiogroups with Arrow key selection.
4. **Layout Shift Prevention (CLS)**: Image aspect ratios (`aspect-square`) and skeleton placeholders matching the exact rendered card geometry.
5. **Reduced Motion**: CSS `@media (prefers-reduced-motion: reduce)` disables shimmer gradient movements and smooth transitions.

---

## 7. Interactive Scenarios & Network Simulation (DevToolbar)

To provide evaluators with a seamless testing environment for all failure states and edge cases described in the challenge:

- **`DevToolbar` Floating Widget**: Located at the bottom-right corner of the application (`components/DevToolbar.tsx`).
- **Simulate Real-Time Socket.IO**: Emits an instant `nft.updated` event with altered edition price. Surfaces live alerts across catalog, cart, and checkout.
- **Simulate Order Decline**: Overrides simulated blockchain confirmation to force HTTP/WS `declined` state with retry flow.
- **Simulate Network Latency**: Toggles between normal 150ms delay and 2500ms slow network to visually evaluate skeleton shimmer effects.
- **Instant Role Switch**: Quickly switch between Alice Chen, Bob Martinez, or guest session without typing credentials.
- **Complete Mock Reset**: One-click purge of `localStorage` and `sessionStorage`, reinstating pristine demo fixtures.
