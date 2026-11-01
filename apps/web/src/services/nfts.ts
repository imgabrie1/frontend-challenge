import { api } from '@/lib/axios';
import type { NFT, NFTFilters, PaginatedResponse, ApiResponse } from '@/types';

export const nftsService = {
  list: (filters: NFTFilters = {}) =>
    api
      .get<PaginatedResponse<NFT>>('/nfts', { params: filters })
      .then((r) => r.data),

  getById: (id: string) =>
    api.get<ApiResponse<NFT>>(`/nfts/${id}`).then((r) => r.data.data),
};
