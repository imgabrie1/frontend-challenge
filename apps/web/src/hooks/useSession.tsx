import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { User, Cart } from "@/types";
import { authService } from "@/services/auth";
import { cartService } from "@/services/cart";

interface SessionContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedFields: Partial<User>) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    if (!token) {
      setIsLoading(false);
      return;
    }
    authService
      .session()
      .then((u) => {
        const savedAvatar = u?.username
          ? localStorage.getItem(`avatar_${u.username}`)
          : null;
        setUser({
          ...u,
          avatarUrl: savedAvatar || u.avatarUrl,
        });
      })
      .catch(() => {
        sessionStorage.removeItem("access_token");
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      sessionStorage.removeItem("access_token");
      queryClient.clear();
    };
    window.addEventListener("auth:expired", handleExpired);
    return () => window.removeEventListener("auth:expired", handleExpired);
  }, [queryClient]);

  const login = async (u: User, token: string) => {
    const guestCart = queryClient.getQueryData<Cart>(["cart"]);
    sessionStorage.setItem("access_token", token);

    const savedAvatar = u?.username
      ? localStorage.getItem(`avatar_${u.username}`)
      : null;
    setUser({
      ...u,
      avatarUrl: savedAvatar || u.avatarUrl,
    });

    if (guestCart && guestCart.items.length > 0) {
      try {
        await cartService.merge(guestCart.items);
      } catch (err){
        console.log(err)
      }
    }

    void queryClient.invalidateQueries();
  };

  const updateUser = (updatedFields: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : null));
  };

  const logout = async () => {
    await authService.logout().catch(() => {});
    sessionStorage.removeItem("access_token");
    setUser(null);
    queryClient.clear();
  };

  return (
    <SessionContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
