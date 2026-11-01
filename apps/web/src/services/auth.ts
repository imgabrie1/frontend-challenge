import { api } from '@/lib/axios';
import type { ApiResponse, LoginRequest, LoginResponse, RegisterRequest, User } from '@/types';

export const authService = {
  login: (body: LoginRequest) =>
    api.post<ApiResponse<LoginResponse>>('/auth/login', body).then((r) => r.data.data),

  register: (body: RegisterRequest) =>
    api.post<ApiResponse<LoginResponse>>('/auth/register', body).then((r) => r.data.data),

  logout: () => api.post('/auth/logout').then(() => undefined),

  session: () =>
    api.get<ApiResponse<User>>('/auth/session').then((r) => r.data.data),
};
