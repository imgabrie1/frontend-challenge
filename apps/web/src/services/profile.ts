import { api } from "@/lib/axios";
import type {
  ApiResponse,
  ChangePasswordRequest,
  UpdateProfileRequest,
  User,
} from "@/types";

export const profileService = {
  get: () => api.get<ApiResponse<User>>("/profile").then((r) => r.data.data),

  update: (body: UpdateProfileRequest) =>
    api.put<ApiResponse<User>>("/profile", body).then((r) => r.data.data),

  changePassword: (body: ChangePasswordRequest) =>
    api.post("/profile/password", body).then(() => undefined),

  uploadAvatar: async (file: File) => {
    const form = new FormData();
    form.append("avatar", file);

    try {
      const response = await api.post<ApiResponse<{ avatarUrl: string }>>(
        "/profile/avatar",
        form,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      return response.data.data?.avatarUrl || URL.createObjectURL(file);
    } catch {
      return URL.createObjectURL(file);
    }
  },
};
