import { api } from '@/lib/axios';
import type { ApiResponse, Favorite } from '@/types';

export const favoritesService = {
  list: () =>
    api.get<ApiResponse<Favorite[]>>('/favorites').then((r) => r.data.data),

  add: (nftId: string) =>
    api.post<ApiResponse<Favorite>>('/favorites', { nftId }).then((r) => r.data.data),

  remove: (nftId: string) =>
    api.delete(`/favorites/${nftId}`).then(() => undefined),
};
