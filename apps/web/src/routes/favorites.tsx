import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { favoritesService } from '@/services/favorites'
import { nftsService } from '@/services/nfts'
import { useSession } from '@/hooks/useSession'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toaster'
import { Heart, ShoppingBag, Lock } from 'lucide-react'
import { formatEth } from '@/lib/utils'
import type { NFT } from '@/types'

export const Route = createFileRoute('/favorites')({
  component: FavoritesPage,
})

function FavoritesPage() {
  const { isAuthenticated, isLoading: authLoading } = useSession()
  const queryClient = useQueryClient()

  const { data: favorites, isLoading: favLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: favoritesService.list,
    enabled: isAuthenticated,
  })

  const nftIds = favorites?.map((f) => f.nftId) ?? []

  const nftQueries = useQuery({
    queryKey: ['favorites-nfts', nftIds],
    queryFn: async () => {
      if (nftIds.length === 0) return []
      const results = await Promise.all(nftIds.map((id) => nftsService.getById(id)))
      return results
    },
    enabled: nftIds.length > 0,
  })

  const removeMutation = useMutation({
    mutationFn: (nftId: string) => favoritesService.remove(nftId),
    onMutate: async (nftId) => {
      await queryClient.cancelQueries({ queryKey: ['favorites'] })
      const prev = queryClient.getQueryData(['favorites'])
      queryClient.setQueryData(['favorites'], (old: typeof favorites) =>
        old ? old.filter((f) => f.nftId !== nftId) : old,
      )
      queryClient.setQueriesData({ queryKey: ['nfts'] }, (old: any) => {
        if (!old) return old
        if (old.data && Array.isArray(old.data)) {
          return { ...old, data: old.data.map((n: NFT) => n.id === nftId ? { ...n, isFavorited: false } : n) }
        }
        if (old.id === nftId) return { ...old, isFavorited: false }
        return old
      })
      return { prev }
    },
    onError: (_err, _nftId, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['favorites'], ctx.prev)
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível remover dos favoritos.' })
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['favorites'] })
      void queryClient.invalidateQueries({ queryKey: ['nfts'] })
    },
  })

  const isLoading = authLoading || favLoading

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Skeleton className="h-9 w-48 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-72 w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-muted/60 flex items-center justify-center mx-auto mb-4">
          <Lock className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Sign in to see your favorites</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Your favorited NFTs will appear here once you're logged in.
        </p>
        <Button asChild>
          <Link to="/login" search={{ redirect: '/favorites' }}>Sign In</Link>
        </Button>
      </div>
    )
  }

  const nfts = nftQueries.data ?? []
  const isEmpty = !nftQueries.isLoading && nfts.length === 0

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-8">
        <Heart className="h-6 w-6 text-primary fill-primary" aria-hidden="true" />
        <h1 className="text-3xl font-extrabold">My Favorites</h1>
        {nfts.length > 0 && (
          <Badge variant="secondary" className="ml-1 text-xs">
            {nfts.length}
          </Badge>
        )}
      </div>

      {nftQueries.isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-72 w-full rounded-xl" />
          ))}
        </div>
      )}

      {isEmpty && (
        <div className="text-center py-20 rounded-xl border border-border bg-card/40">
          <div className="w-16 h-16 rounded-full bg-muted/60 flex items-center justify-center mx-auto mb-4">
            <Heart className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold mb-2">No favorites yet</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Tap the heart on any NFT to save it here.
          </p>
          <Button asChild>
            <Link to="/">
              <ShoppingBag className="mr-2 h-4 w-4" aria-hidden="true" />
              Explore Marketplace
            </Link>
          </Button>
        </div>
      )}

      {!nftQueries.isLoading && nfts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {nfts.map((nft) => (
            <FavoriteCard
              key={nft.id}
              nft={nft}
              onRemove={() => removeMutation.mutate(nft.id)}
              isRemoving={removeMutation.isPending && removeMutation.variables === nft.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function FavoriteCard({
  nft,
  onRemove,
  isRemoving,
}: {
  nft: NFT
  onRemove: () => void
  isRemoving: boolean
}) {
  const lowestPrice = nft.editions.reduce(
    (min, ed) => (parseFloat(ed.price) < parseFloat(min) ? ed.price : min),
    nft.editions[0]?.price ?? '0',
  )
  const totalAvailable = nft.editions.reduce((sum, ed) => sum + ed.available, 0)

  return (
    <article className="group relative rounded-xl border border-border/80 bg-card overflow-hidden hover:border-primary/50 transition-all hover:shadow-lg flex flex-col">
      <Link
        to="/nfts/$id"
        params={{ id: nft.id }}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-t-xl"
        aria-label={`View details for ${nft.name}`}
      >
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={nft.imageUrl}
            alt={nft.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
            <Badge variant="secondary" className="bg-background/80 backdrop-blur text-xs">
              {nft.category}
            </Badge>
            <Badge variant="outline" className="bg-background/80 backdrop-blur text-xs capitalize">
              {nft.network}
            </Badge>
          </div>
        </div>
      </Link>

      <button
        onClick={onRemove}
        disabled={isRemoving}
        aria-label={`Remove ${nft.name} from favorites`}
        className="absolute top-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur hover:bg-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary z-10 cursor-pointer disabled:opacity-50"
      >
        <Heart
          className="h-4 w-4 fill-primary text-primary transition-colors"
          aria-hidden="true"
        />
      </button>

      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground truncate">{nft.collection}</p>
          <h2 className="font-semibold text-base mt-0.5 group-hover:text-primary transition-colors truncate">
            <Link to="/nfts/$id" params={{ id: nft.id }}>
              {nft.name}
            </Link>
          </h2>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div>
            <p className="text-xs text-muted-foreground">From</p>
            <p className="text-sm font-bold text-foreground">{formatEth(lowestPrice)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Available</p>
            <p className={`text-xs font-medium ${totalAvailable === 0 ? 'text-destructive' : 'text-foreground'}`}>
              {totalAvailable === 0 ? 'Sold out' : totalAvailable}
            </p>
          </div>
        </div>
      </div>
    </article>
  )
}
