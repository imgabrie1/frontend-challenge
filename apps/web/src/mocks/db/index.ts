import type {
  Cart,
  Favorite,
  NFT,
  Order,
  User,
  Wallet,
} from '@/types';

// ===== FIXTURES ======

const USERS: User[] = [
  {
    id: 'user-alice',
    email: 'alice@nftmarket.dev',
    name: 'Alice Chen',
    username: 'alice_chen',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
    bio: 'Digital art collector & crypto enthusiast',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'user-bob',
    email: 'bob@nftmarket.dev',
    name: 'Bob Martinez',
    username: 'bob_m',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
    bio: 'NFT trader and blockchain developer',
    createdAt: '2024-02-20T14:00:00Z',
  },
];

const USER_PASSWORDS: Record<string, string> = {
  'user-alice': 'Alice@123',
  'user-bob': 'Bob@123',
};

const CATEGORIES = ['art', 'music', 'gaming', 'sports', 'collectibles', 'virtual-worlds'] as const;
const NETWORKS = ['ethereum', 'polygon', 'solana'] as const;

const NFT_IMAGES = [
  'https://picsum.photos/seed/nft1/800/800',
  'https://picsum.photos/seed/nft2/800/800',
  'https://picsum.photos/seed/nft3/800/800',
  'https://picsum.photos/seed/nft4/800/800',
  'https://picsum.photos/seed/nft5/800/800',
  'https://picsum.photos/seed/nft6/800/800',
  'https://picsum.photos/seed/nft7/800/800',
  'https://picsum.photos/seed/nft8/800/800',
  'https://picsum.photos/seed/nft9/800/800',
  'https://picsum.photos/seed/nft10/800/800',
  'https://picsum.photos/seed/nft11/800/800',
  'https://picsum.photos/seed/nft12/800/800',
  'https://picsum.photos/seed/nft13/800/800',
  'https://picsum.photos/seed/nft14/800/800',
  'https://picsum.photos/seed/nft15/800/800',
  'https://picsum.photos/seed/nft16/800/800',
  'https://picsum.photos/seed/nft17/800/800',
  'https://picsum.photos/seed/nft18/800/800',
  'https://picsum.photos/seed/nft19/800/800',
  'https://picsum.photos/seed/nft20/800/800',
];

const NFT_NAMES = [
  'Cosmic Drift #1', 'Neon Genesis #7', 'Pixel Dreams #42', 'Digital Soul #3',
  'Quantum Realm #15', 'Cyber Phoenix #8', 'Abstract Void #21', 'Electric Mind #5',
  'Chrome Dragon #11', 'Aurora Borealis #99', 'Dark Matter #33', 'Genesis Block #1',
  'Fractured Time #6', 'Neural Storm #14', 'Forgotten Gods #7', 'Binary Star #22',
  'Parallel World #4', 'Void Walker #18', 'Crystal Entity #9', 'Solana Sunrise #1',
];

function makeNFTs(): NFT[] {
  return NFT_NAMES.map((name, i) => {
    const idx = i + 1;
    const price = (0.01 + (i * 0.1)).toFixed(4);
    const price2 = (parseFloat(price) * 1.5).toFixed(4);
    const price3 = (parseFloat(price) * 2).toFixed(4);
    return {
      id: `nft-${idx}`,
      name,
      description: `An extraordinary piece of digital art — ${name}. Created with passion and precision, this NFT represents a unique moment in the digital art world.`,
      imageUrl: NFT_IMAGES[i],
      images: [NFT_IMAGES[i], NFT_IMAGES[(i + 5) % 20], NFT_IMAGES[(i + 10) % 20]],
      creator: {
        id: i % 2 === 0 ? 'user-alice' : 'user-bob',
        name: i % 2 === 0 ? 'Alice Chen' : 'Bob Martinez',
        username: i % 2 === 0 ? 'alice_chen' : 'bob_m',
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i % 2 === 0 ? 'alice' : 'bob'}`,
        verified: i % 3 === 0,
      },
      collection: ['Genesis Collection', 'Cyber Series', 'Digital Dreams'][i % 3],
      category: CATEGORIES[i % CATEGORIES.length],
      network: NETWORKS[i % NETWORKS.length],
      editions: [
        { id: `edition-${idx}-standard`, name: 'Standard Edition', price, available: 10 - (i % 5), total: 10 },
        { id: `edition-${idx}-gold`, name: 'Gold Edition', price: price2, available: 3 - (i % 2), total: 3 },
        { id: `edition-${idx}-platinum`, name: 'Platinum Edition', price: price3, available: 1, total: 1 },
      ],
      isFavorited: false,
      viewCount: (i + 1) * 137,
      version: 1,
      createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    };
  });
}

const COUPONS: Record<string, { discountPercent: number; expiresAt: string | null; active: boolean }> = {
  SAVE10: { discountPercent: 10, expiresAt: null, active: true },
  SAVE20: { discountPercent: 20, expiresAt: '2025-12-31T23:59:59Z', active: true },
  EXPIRED: { discountPercent: 15, expiresAt: '2020-01-01T00:00:00Z', active: false },
};

// ===== DATABASE =====

const STORAGE_KEY = 'msw_db';

interface DbState {
  nfts: NFT[];
  users: User[];
  sessions: Record<string, string>;
  favorites: Record<string, string[]>;
  carts: Record<string, Cart>;
  guestCart: Cart;
  wallets: Wallet[];
  orders: Order[];
}

function defaultState(): DbState {
  const nfts = makeNFTs();
  return {
    nfts,
    users: USERS,
    sessions: {},
    favorites: {},
    carts: {},
    guestCart: { items: [], couponCode: null },
    wallets: [
      {
        id: 'wallet-alice-1',
        userId: 'user-alice',
        address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        role: 'primary',
        network: 'ethereum',
        label: 'Main Wallet',
        createdAt: '2024-01-15T10:00:00Z',
      },
      {
        id: 'wallet-alice-2',
        userId: 'user-alice',
        address: '0x1234567890abcdef1234567890abcdef12345678',
        role: 'secondary',
        network: 'polygon',
        label: 'Polygon Wallet',
        createdAt: '2024-03-01T10:00:00Z',
      },
      {
        id: 'wallet-bob-1',
        userId: 'user-bob',
        address: '0xabcdef1234567890abcdef1234567890abcdef12',
        role: 'primary',
        network: 'ethereum',
        label: 'Bob Main',
        createdAt: '2024-02-20T14:00:00Z',
      },
    ],
    orders: [],
  };
}

function loadState(): DbState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DbState;
  } catch(err) {
    console.log(err)
  }
  return defaultState();
}

function saveState(state: DbState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch(err) {
    console.log(err)
  }
}

class Database {
  private state: DbState;

  constructor() {
    this.state = loadState();
  }

  reset() {
    this.state = defaultState();
    saveState(this.state);
  }

  persist() { saveState(this.state); }

  // ---- Users ----
  getUserByEmail(email: string) { return this.state.users.find((u) => u.email === email); }
  getUserById(id: string) { return this.state.users.find((u) => u.id === id); }
  checkPassword(userId: string, password: string) { return USER_PASSWORDS[userId] === password; }
  emailExists(email: string) { return this.state.users.some((u) => u.email === email); }
  usernameExists(username: string) { return this.state.users.some((u) => u.username === username); }

  createUser(data: Omit<User, 'id' | 'createdAt'> & { password: string }) {
    const user: User = {
      id: `user-${Date.now()}`,
      email: data.email, name: data.name, username: data.username,
      avatarUrl: data.avatarUrl, bio: data.bio,
      createdAt: new Date().toISOString(),
    };
    this.state.users.push(user);
    USER_PASSWORDS[user.id] = data.password;
    this.persist();
    return user;
  }

  updateUser(userId: string, updates: Partial<User>) {
    const idx = this.state.users.findIndex((u) => u.id === userId);
    if (idx === -1) return null;
    this.state.users[idx] = { ...this.state.users[idx], ...updates };
    this.persist();
    return this.state.users[idx];
  }

  changePassword(userId: string, currentPassword: string, newPassword: string) {
    if (USER_PASSWORDS[userId] !== currentPassword) return false;
    USER_PASSWORDS[userId] = newPassword;
    return true;
  }

  // ---- Sessions ----
  createSession(userId: string) {
    const token = `token-${userId}-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
    this.state.sessions[token] = userId;
    this.persist();
    return { token, expiresAt };
  }

  getUserByToken(token: string) {
    const userId = this.state.sessions[token];
    if (!userId) return null;
    return this.getUserById(userId) ?? null;
  }

  deleteSession(token: string) {
    delete this.state.sessions[token];
    this.persist();
  }

  // ---- NFTs ----
  getNFTs(filters: {
    search?: string; category?: string; network?: string;
    minPrice?: string; maxPrice?: string; sortBy?: string;
    page?: number; limit?: number;
  } = {}) {
    let items = [...this.state.nfts];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter((n) =>
        n.name.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q) ||
        n.collection.toLowerCase().includes(q),
      );
    }
    if (filters.category) items = items.filter((n) => n.category === filters.category);
    if (filters.network) items = items.filter((n) => n.network === filters.network);
    if (filters.minPrice) {
      const min = parseFloat(filters.minPrice);
      items = items.filter((n) => parseFloat(n.editions[0].price) >= min);
    }
    if (filters.maxPrice) {
      const max = parseFloat(filters.maxPrice);
      items = items.filter((n) => parseFloat(n.editions[0].price) <= max);
    }

    switch (filters.sortBy) {
      case 'price_asc': items.sort((a, b) => parseFloat(a.editions[0].price) - parseFloat(b.editions[0].price)); break;
      case 'price_desc': items.sort((a, b) => parseFloat(b.editions[0].price) - parseFloat(a.editions[0].price)); break;
      case 'popular': items.sort((a, b) => b.viewCount - a.viewCount); break;
      default: items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(50, Math.max(1, filters.limit ?? 12));
    const total = items.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;

    return { data: items.slice(start, start + limit), pagination: { page, limit, total, totalPages } };
  }

  getNFTById(id: string) { return this.state.nfts.find((n) => n.id === id) ?? null; }

  updateNFTEdition(nftId: string, editionId: string, changes: { price?: string; available?: number }) {
    const nft = this.state.nfts.find((n) => n.id === nftId);
    if (!nft) return null;
    const edition = nft.editions.find((e) => e.id === editionId);
    if (!edition) return null;
    if (changes.price !== undefined) edition.price = changes.price;
    if (changes.available !== undefined) edition.available = changes.available;
    nft.version = (nft.version ?? 1) + 1;
    this.persist();
    return nft;
  }

  // ---- Favorites ----
  getFavorites(userId: string) { return this.state.favorites[userId] ?? []; }
  addFavorite(userId: string, nftId: string) {
    if (!this.state.favorites[userId]) this.state.favorites[userId] = [];
    if (!this.state.favorites[userId].includes(nftId)) {
      this.state.favorites[userId].push(nftId);
      this.persist();
    }
  }
  removeFavorite(userId: string, nftId: string) {
    if (!this.state.favorites[userId]) return;
    this.state.favorites[userId] = this.state.favorites[userId].filter((id) => id !== nftId);
    this.persist();
  }

  // ---- Cart ----
  getCart(userId: string | null): Cart {
    if (!userId) return this.state.guestCart;
    return this.state.carts[userId] ?? { items: [], couponCode: null };
  }

  setCart(userId: string | null, cart: Cart) {
    if (!userId) { this.state.guestCart = cart; }
    else { this.state.carts[userId] = cart; }
    this.persist();
  }

  mergeCart(userId: string, guestItems: Cart['items']) {
    const userCart = this.getCart(userId);
    for (const guestItem of guestItems) {
      const nft = this.getNFTById(guestItem.nftId);
      const edition = nft?.editions.find((e) => e.id === guestItem.editionId);
      const maxAvailable = edition?.available ?? 10;
      const existing = userCart.items.find(
        (i) => i.nftId === guestItem.nftId && i.editionId === guestItem.editionId,
      );
      if (existing) {
        existing.quantity = Math.min(existing.quantity + guestItem.quantity, maxAvailable);
      } else {
        userCart.items.push({
          ...guestItem,
          quantity: Math.min(guestItem.quantity, maxAvailable),
        });
      }
    }
    this.state.guestCart = { items: [], couponCode: null };
    this.setCart(userId, userCart);
    return userCart;
  }

  // ---- Coupons ----
  validateCoupon(code: string) {
    const coupon = COUPONS[code.toUpperCase()];
    if (!coupon) return { valid: false, error: 'invalid' as const };
    if (!coupon.active) return { valid: false, error: 'invalid' as const };
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return { valid: false, error: 'expired' as const };
    }
    return { valid: true, discountPercent: coupon.discountPercent, expiresAt: coupon.expiresAt };
  }

  // ---- Quote ----
  computeQuote(userId: string | null, couponCode: string | null) {
    const cart = this.getCart(userId);
    const items = cart.items.map((item) => {
      const nft = this.getNFTById(item.nftId);
      const edition = nft?.editions.find((e) => e.id === item.editionId);
      const currentPrice = edition?.price ?? item.edition.price;
      const priceChanged = currentPrice !== item.edition.price;
      const available = edition?.available ?? 0;
      const insufficientStock = available < item.quantity;
      const subtotal = (parseFloat(currentPrice) * item.quantity).toFixed(6);
      return { nftId: item.nftId, editionId: item.editionId, quantity: item.quantity, unitPrice: currentPrice, subtotal, available, priceChanged, insufficientStock };
    });

    const subtotalNum = items.reduce((acc, i) => acc + parseFloat(i.subtotal), 0);
    let discountNum = 0;
    if (couponCode) {
      const validation = this.validateCoupon(couponCode);
      if (validation.valid) discountNum = subtotalNum * ((validation.discountPercent ?? 0) / 100);
    }
    const networkFeeNum = subtotalNum * 0.025;
    const totalNum = subtotalNum - discountNum + networkFeeNum;

    return {
      items,
      subtotal: subtotalNum.toFixed(6),
      discount: discountNum.toFixed(6),
      networkFee: networkFeeNum.toFixed(6),
      total: totalNum.toFixed(6),
      couponApplied: discountNum > 0,
      couponCode: discountNum > 0 ? couponCode : null,
      exchangeRate: 2400,
    };
  }

  // ---- Wallets ----
  getWallets(userId: string) { return this.state.wallets.filter((w) => w.userId === userId); }
  getWalletById(id: string) { return this.state.wallets.find((w) => w.id === id) ?? null; }

  createWallet(userId: string, data: { address: string; role: string; network: string; label: string }) {
    const wallet: Wallet = {
      id: `wallet-${Date.now()}`,
      userId, address: data.address,
      role: data.role as Wallet['role'],
      network: data.network as Wallet['network'],
      label: data.label,
      createdAt: new Date().toISOString(),
    };
    this.state.wallets.push(wallet);
    this.persist();
    return wallet;
  }

  updateWallet(id: string, updates: Partial<Wallet>) {
    const idx = this.state.wallets.findIndex((w) => w.id === id);
    if (idx === -1) return null;
    this.state.wallets[idx] = { ...this.state.wallets[idx], ...updates };
    this.persist();
    return this.state.wallets[idx];
  }

  // ---- Orders ----
  getOrderById(id: string) { return this.state.orders.find((o) => o.id === id) ?? null; }
  getOrderByIdempotencyKey(key: string) { return this.state.orders.find((o) => o.idempotencyKey === key) ?? null; }

  createOrder(order: Order) {
    this.state.orders.push(order);
    this.persist();
    return order;
  }

  updateOrder(id: string, updates: Partial<Order>) {
    const idx = this.state.orders.findIndex((o) => o.id === id);
    if (idx === -1) return null;
    this.state.orders[idx] = {
      ...this.state.orders[idx],
      ...updates,
      version: (this.state.orders[idx].version ?? 1) + 1,
    };
    this.persist();
    return this.state.orders[idx];
  }
}

export type { Favorite };
export const db = new Database();
