import { api } from '@/lib/axios';
import type { ApiResponse, Cart } from '@/types';

export const cartService = {
  get: () =>
    api.get<ApiResponse<Cart>>('/cart').then((r) => r.data.data),

  addItem: (nftId: string, editionId: string, quantity: number) =>
    api
      .post<ApiResponse<Cart>>('/cart/items', { nftId, editionId, quantity })
      .then((r) => r.data.data),

  updateItem: (nftId: string, editionId: string, quantity: number) =>
    api
      .patch<ApiResponse<Cart>>(`/cart/items/${nftId}/${editionId}`, { quantity })
      .then((r) => r.data.data),

  removeItem: (nftId: string, editionId: string) =>
    api.delete(`/cart/items/${nftId}/${editionId}`).then(() => undefined),

  applyCoupon: (code: string) =>
    api.post<ApiResponse<Cart>>('/cart/coupon', { code }).then((r) => r.data.data),

  removeCoupon: () =>
    api.delete<ApiResponse<Cart>>('/cart/coupon').then((r) => r.data.data),

  merge: (guestItems: Cart['items']) =>
    api.post<ApiResponse<Cart>>('/cart/merge', { items: guestItems }).then((r) => r.data.data),
};
