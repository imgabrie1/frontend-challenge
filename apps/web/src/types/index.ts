export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface ApiResponse<T> {
  data: T;
}

export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  expiresAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  name: string;
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}
export type NFTNetwork = 'ethereum' | 'polygon' | 'solana';
export type NFTCategory = 'art' | 'music' | 'gaming' | 'sports' | 'collectibles' | 'virtual-worlds';

export interface NFTEdition {
  id: string;
  name: string;
  price: string;
  available: number;
  total: number;
}

export interface NFT {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  images: string[];
  creator: {
    id: string;
    name: string;
    username: string;
    avatarUrl: string | null;
    verified: boolean;
  };
  collection: string;
  category: NFTCategory;
  network: NFTNetwork;
  editions: NFTEdition[];
  isFavorited: boolean;
  viewCount: number;
  version: number;
  createdAt: string;
}

export interface NFTFilters {
  search?: string;
  category?: NFTCategory;
  network?: NFTNetwork;
  minPrice?: string;
  maxPrice?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'popular';
  page?: number;
  limit?: number;
}

export interface Favorite {
  nftId: string;
  userId: string;
  createdAt: string;
}

export interface CartItem {
  nftId: string;
  editionId: string;
  quantity: number;
  nft: Pick<NFT, 'id' | 'name' | 'imageUrl' | 'network'>;
  edition: Pick<NFTEdition, 'id' | 'name' | 'price'>;
}

export interface Cart {
  items: CartItem[];
  couponCode: string | null;
}

export interface QuoteItem {
  nftId: string;
  editionId: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
  available: number;
  priceChanged: boolean;
  insufficientStock: boolean;
}

export interface QuoteResponse {
  items: QuoteItem[];
  subtotal: string;
  discount: string;
  networkFee: string;
  total: string;
  couponApplied: boolean;
  couponCode: string | null;
  exchangeRate: number;
}

export interface CouponValidation {
  valid: boolean;
  code: string;
  discountPercent: number;
  expiresAt: string | null;
  error?: 'invalid' | 'expired';
}

export type WalletRole = 'primary' | 'secondary';
export type WalletNetwork = 'ethereum' | 'polygon' | 'solana';

export interface Wallet {
  id: string;
  userId: string;
  address: string;
  role: WalletRole;
  network: WalletNetwork;
  label: string;
  createdAt: string;
}

export interface CreateWalletRequest {
  address: string;
  role: WalletRole;
  network: WalletNetwork;
  label: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'declined';

export interface OrderItem {
  nftId: string;
  editionId: string;
  quantity: number;
  nftName: string;
  editionName: string;
  imageUrl: string;
  unitPrice: string;
  subtotal: string;
}

export interface Order {
  id: string;
  idempotencyKey: string;
  userId: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: string;
  discount: string;
  networkFee: string;
  total: string;
  couponCode: string | null;
  walletAddress: string;
  walletNetwork: WalletNetwork;
  transactionHash: string | null;
  explorerUrl: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface CreateOrderRequest {
  idempotencyKey: string;
  items: { nftId: string; editionId: string; quantity: number }[];
  couponCode: string | null;
  walletId: string;
  quoteTotal: string;
}

export interface UpdateProfileRequest {
  name: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface NFTUpdatedEvent {
  type: 'nft.updated';
  nftId: string;
  version: number;
  changes: {
    price?: string;
    available?: number;
    editionId?: string;
  };
}

export interface OrderUpdatedEvent {
  type: 'order.updated';
  orderId: string;
  userId: string;
  version: number;
  status: OrderStatus;
  transactionHash: string | null;
}

export type SocketEvent = NFTUpdatedEvent | OrderUpdatedEvent;
