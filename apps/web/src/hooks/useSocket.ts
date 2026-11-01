import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "./useSession";
import type {
  NFT,
  NFTUpdatedEvent,
  OrderUpdatedEvent,
  PaginatedResponse,
} from "@/types";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:5173");

export function useSocket() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const nftVersionsRef = useRef<Record<string, number>>({});
  const orderVersionsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const token = sessionStorage.getItem("access_token");

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("connected");
    });

    socket.on("disconnect", () => {
      console.log("disconnected");
    });

    socket.on("reconnect", () => {
      void queryClient.invalidateQueries({ queryKey: ["nfts"] });
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
      void queryClient.invalidateQueries({ queryKey: ["quote"] });
      if (user) {
        void queryClient.invalidateQueries({ queryKey: ["orders"] });
        void queryClient.invalidateQueries({ queryKey: ["wallets"] });
        void queryClient.invalidateQueries({ queryKey: ["profile"] });
      }
    });

    socket.on("nft.updated", (event: NFTUpdatedEvent) => {
      const current = nftVersionsRef.current[event.nftId] ?? 0;
      if (event.version <= current) return;
      nftVersionsRef.current[event.nftId] = event.version;

      const { nftId, changes } = event;

      if (changes.available !== undefined && changes.editionId !== undefined) {
        const { available, editionId } = changes;

        const patchNFT = (nft: NFT): NFT => {
          if (nft.id !== nftId) return nft;
          return {
            ...nft,
            version: event.version,
            editions: nft.editions.map((ed) =>
              ed.id === editionId ? { ...ed, available } : ed,
            ),
          };
        };

        queryClient.setQueriesData<PaginatedResponse<NFT>>(
          { queryKey: ["nfts"], exact: false },
          (old) => (old ? { ...old, data: old.data.map(patchNFT) } : old),
        );

        queryClient.setQueryData<NFT>(["nfts", nftId], (old) =>
          old ? patchNFT(old) : old,
        );
      } else {
        void queryClient.invalidateQueries({
          queryKey: ["nfts", nftId],
          refetchType: "all",
        });
        void queryClient.invalidateQueries({
          queryKey: ["nfts"],
          refetchType: "all",
        });
      }

      void queryClient.invalidateQueries({ queryKey: ["cart"] });
      void queryClient.invalidateQueries({ queryKey: ["quote"] });
    });

    socket.on("order.updated", (event: OrderUpdatedEvent) => {
      if (!user || event.userId !== user.id) return;

      const current = orderVersionsRef.current[event.orderId] ?? 0;
      if (event.version <= current) return;
      orderVersionsRef.current[event.orderId] = event.version;

      void queryClient.invalidateQueries({
        queryKey: ["orders", event.orderId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["cart"],
        refetchType: "all",
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id, queryClient]);

  return socketRef;
}
