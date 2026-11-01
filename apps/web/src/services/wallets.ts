import { api } from '@/lib/axios';
import type { ApiResponse, CreateWalletRequest, Wallet } from '@/types';

export const walletsService = {
  list: () =>
    api.get<ApiResponse<Wallet[]>>('/wallets').then((r) => r.data.data),

  create: (body: CreateWalletRequest) =>
    api.post<ApiResponse<Wallet>>('/wallets', body).then((r) => r.data.data),

  update: (id: string, body: Partial<CreateWalletRequest>) =>
    api.put<ApiResponse<Wallet>>(`/wallets/${id}`, body).then((r) => r.data.data),
};
