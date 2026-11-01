import { api } from '@/lib/axios';
import type { ApiResponse, CreateOrderRequest, Order } from '@/types';

export const ordersService = {
  create: (body: CreateOrderRequest) =>
    api.post<ApiResponse<Order>>('/orders', body).then((r) => r.data.data),

  getById: (id: string) =>
    api.get<ApiResponse<Order>>(`/orders/${id}`).then((r) => r.data.data),
};
