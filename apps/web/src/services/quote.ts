import { api } from '@/lib/axios';
import type { ApiResponse, QuoteResponse } from '@/types';

export const quoteService = {
  get: (couponCode: string | null = null) =>
    api
      .post<ApiResponse<QuoteResponse>>('/quote', { couponCode })
      .then((r) => r.data.data),
};
