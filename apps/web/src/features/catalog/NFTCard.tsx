import { Link } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { NFT } from '@/types'
import { favoritesService } from '@/services/favorites'
import { useSession } from '@/hooks/useSession'
import { formatEth } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'

interface NFTCardProps {
  nft: NFT
}

export function NFTCard({ nft }: NFTCardProps) {
  const { isAuthenticated } = useSession()
  const queryClient = useQueryClient()

  const favoriteMutation = useMutation({
    mutationFn: () =>
      nft.isFavorited ? favoritesService.remove(nft.id) : favoritesService.add(nft.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['nfts'] })
      const previousData = queryClient.getQueriesData({ queryKey: ['nfts'] })

      queryClient.setQueriesData({ queryKey: ['nfts'] }, (old: any) => {
        if (!old) return old
        if (old.data && Array.isArray(old.data)) {
          return {
            ...old,
            data: old.data.map((item: NFT) =>
              item.id === nft.id ? { ...item, isFavorited: !item.isFavorited } : item,
            ),
          }
        }
        if (old.id === nft.id) {
          return { ...old, isFavorited: !old.isFavorited }
        }
        return old
      })

      return { previousData }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao atualizar favoritos. Tente novamente.',
      })
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['nfts'] })
    },
  })

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to favorite NFTs.',
      })
      return
    }
    favoriteMutation.mutate()
  }

  const standardPrice = nft.editions[0]?.price ?? '0.00'
  const goldPrice = nft.editions[1]?.price

  return (
    <article className="group relative rounded-xl border border-border/80 bg-[#1a110a] overflow-hidden hover:border-primary/60 transition-all hover:shadow-xl flex flex-col">
      <Link
        to="/nfts/$id"
        params={{ id: nft.id }}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary p-2 pb-0"
        aria-label={`View details for ${nft.name}`}
      >
        <div className="relative aspect-square overflow-hidden rounded-lg bg-[#25190f]">
          <img
            src={nft.imageUrl}
            alt={nft.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
            <span className="bg-[#140d07]/80 backdrop-blur text-[10px] uppercase font-mono px-1.5 py-0.5 rounded text-muted-foreground border border-border/40">
              {nft.category}
            </span>
          </div>
        </div>
      </Link>

      <button
        onClick={handleFavoriteClick}
        aria-label={nft.isFavorited ? `Remove ${nft.name} from favorites` : `Add ${nft.name} to favorites`}
        aria-pressed={nft.isFavorited}
        className="absolute top-4 right-4 p-1.5 rounded-full bg-[#140d07]/80 backdrop-blur hover:bg-[#140d07] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary z-10 cursor-pointer"
      >
        <Heart
          className={`h-4 w-4 transition-colors ${
            nft.isFavorited ? 'fill-primary text-primary' : 'text-foreground/70 hover:text-primary'
          }`}
          aria-hidden="true"
        />
      </button>

      <div className="p-3 pt-2.5 flex flex-col justify-between flex-1">
        <div>
          <h2 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
            <Link to="/nfts/$id" params={{ id: nft.id }}>
              {nft.name}
            </Link>
          </h2>
        </div>

        <div className="flex items-baseline gap-2 mt-1">
          <span className="font-mono text-xs font-bold text-[#e5933a]">
            {formatEth(standardPrice)}
          </span>
          {goldPrice && parseFloat(goldPrice) > parseFloat(standardPrice) && (
            <span className="font-mono text-[10px] text-muted-foreground line-through">
              {formatEth(goldPrice)}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
