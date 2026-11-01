import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { nftsService } from '@/services/nfts'
import { cartService } from '@/services/cart'
import { favoritesService } from '@/services/favorites'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useSession } from '@/hooks/useSession'
import { toast } from '@/components/ui/toaster'
import { Heart, Search, ChevronLeft, Minus, Plus, Linkedin, Mail, Twitter } from 'lucide-react'
import { formatEth } from '@/lib/utils'
import { NFTCard } from '@/features/catalog/NFTCard'

export const Route = createFileRoute('/nfts/$id')({
  component: NFTDetailPage,
})

function NFTDetailPage() {
  const { id } = Route.useParams()
  const { isAuthenticated } = useSession()
  const queryClient = useQueryClient()
  const [selectedEditionId, setSelectedEditionId] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details')

  const { data: nft, isLoading, isError, error } = useQuery({
    queryKey: ['nfts', id],
    queryFn: () => nftsService.getById(id),
    retry: (failureCount, err: any) => {
      if (err?.response?.status === 404) return false
      return failureCount < 2
    },
  })

  const { data: catalogData } = useQuery({
    queryKey: ['nfts', { limit: 5 }],
    queryFn: () => nftsService.list({ limit: 5 }),
  })

  const activeEdition = nft?.editions.find(
    (e) => e.id === (selectedEditionId ?? nft.editions[0]?.id),
  )

  const addToCartMutation = useMutation({
    mutationFn: () => {
      if (!nft || !activeEdition) throw new Error('Nenhuma edição selecionada')
      return cartService.addItem(nft.id, activeEdition.id, quantity)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cart'] })
      void queryClient.invalidateQueries({ queryKey: ['quote'] })
      toast({
        title: 'Added to cart!',
        description: `${quantity}x "${nft?.name}" adicionado ao carrinho.`,
      })
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Não foi possível adicionar ao carrinho.'
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: msg,
      })
    },
  })

  const favoriteMutation = useMutation({
    mutationFn: () =>
      nft?.isFavorited ? favoritesService.remove(id) : favoritesService.add(id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['nfts', id] })
      const prev = queryClient.getQueryData(['nfts', id])
      queryClient.setQueryData(['nfts', id], (old: typeof nft) =>
        old ? { ...old, isFavorited: !old.isFavorited } : old,
      )
      return { prev }
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(['nfts', id], context?.prev)
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível atualizar favoritos.',
      })
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['nfts', id] })
      void queryClient.invalidateQueries({ queryKey: ['nfts'] })
    },
  })

  if (isLoading) {
    return <NFTDetailSkeleton />
  }

  if (isError || !nft) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-lg" role="alert">
        <h1 className="text-3xl font-heading font-extrabold mb-3">NFT Not Found</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {(error as any)?.response?.data?.message ||
            'The requested NFT could not be found. It may have been removed or does not exist.'}
        </p>
        <Button asChild className="bg-primary text-[#140d07] font-semibold text-xs">
          <Link to="/">
            <ChevronLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Back to Marketplace
          </Link>
        </Button>
      </div>
    )
  }

  const galleryImages = nft.images && nft.images.length > 0 ? nft.images : [nft.imageUrl, nft.imageUrl, nft.imageUrl, nft.imageUrl]
  const tokenNumber = nft.id.replace(/\D/g, '').padStart(4, '0')

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl space-y-12">
      <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
        <Link to="/" className="hover:text-primary transition-colors">
          Início
        </Link>
        <span>/</span>
        <Link to="/" className="text-foreground">
          Mercado
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-6 flex gap-4">
          <div className="flex flex-col gap-3 flex-shrink-0" role="group" aria-label="Gallery thumbnails">
            {galleryImages.slice(0, 4).map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImageIndex(idx)}
                className={`w-16 h-16 rounded-xl overflow-hidden border transition-all cursor-pointer bg-[#1c130b] ${
                  activeImageIndex === idx
                    ? 'border-primary ring-1 ring-primary'
                    : 'border-border/60 opacity-60 hover:opacity-100 hover:border-primary/50'
                }`}
                aria-label={`Show image ${idx + 1}`}
                aria-pressed={activeImageIndex === idx}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          <div className="flex-1 aspect-square rounded-2xl overflow-hidden border border-border/80 bg-[#1c130b] relative group">
            <img
              src={galleryImages[activeImageIndex] ?? nft.imageUrl}
              alt={nft.name}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              aria-label="Ampliar imagem"
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#140d07]/80 backdrop-blur border border-border flex items-center justify-center text-foreground hover:text-primary transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="lg:col-span-6 space-y-6">
          <div>
            <h1 className="font-heading text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-foreground">
              {nft.name}
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="font-mono text-xl sm:text-2xl font-bold text-[#e5933a]">
                {formatEth(activeEdition?.price ?? nft.editions[0]?.price ?? '0.00')}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="text-[#e5933a] tracking-widest text-sm">★★★★★</span>
                <span>19 avaliações de colecionadores</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs uppercase font-mono font-bold text-muted-foreground tracking-wider mb-1.5">
              Sobre este NFT:
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {nft.description}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label id="edition-group-label" className="text-xs uppercase font-mono font-bold text-muted-foreground tracking-wider">
                Edição:
              </label>
              {activeEdition && (
                <span className="text-[11px] font-mono text-muted-foreground">
                  {activeEdition.available} de {activeEdition.total} restantes
                </span>
              )}
            </div>

            <div
              className="flex flex-wrap gap-2"
              role="radiogroup"
              aria-labelledby="edition-group-label"
            >
              {nft.editions.map((edition, idx) => {
                const isSelected = (selectedEditionId ?? nft.editions[0].id) === edition.id
                const isSoldOut = edition.available === 0
                const pillLabel = idx === 0 ? 'Standard Edition (1/50)' : idx === 1 ? 'Gold Edition (1/10)' : 'Platinum Edition (1/1)'

                return (
                  <button
                    key={edition.id}
                    type="button"
                    onClick={() => {
                      setSelectedEditionId(edition.id)
                      setQuantity(1)
                    }}
                    disabled={isSoldOut}
                    role="radio"
                    aria-label={pillLabel}
                    aria-checked={isSelected}
                    className={`px-3 py-1.5 rounded-full border text-xs font-mono transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary/20 text-primary font-bold ring-1 ring-primary'
                        : 'border-border/80 bg-[#1c130b] text-muted-foreground hover:text-foreground hover:border-primary/50'
                    } ${isSoldOut ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <span>{idx === 0 ? '1/50' : idx === 1 ? '1/10' : '1/1'}</span>
                    <span className="sr-only"> {edition.name}</span>
                  </button>
                )
              })}
              <span className="px-3 py-1.5 rounded-full border border-border/40 text-[11px] font-mono text-muted-foreground/60 select-none">
                ABERTA
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="flex items-center border border-border bg-[#181009] rounded-lg h-10 px-1">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
                className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-8 text-center text-xs font-mono font-bold" aria-live="polite">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() =>
                  setQuantity((q) => Math.min(Math.min(10, activeEdition?.available ?? 1), q + 1))
                }
                disabled={quantity >= Math.min(10, activeEdition?.available ?? 1)}
                aria-label="Increase quantity"
                className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            <button
              type="button"
              disabled={!activeEdition || activeEdition.available === 0 || addToCartMutation.isPending}
              onClick={() => addToCartMutation.mutate()}
              aria-label="Add to Cart"
              className="flex-1 bg-[#d67926] hover:bg-[#e58832] disabled:opacity-50 text-[#140d07] font-bold text-xs uppercase tracking-wider h-10 px-6 rounded-lg transition-colors cursor-pointer shadow-md"
            >
              {addToCartMutation.isPending
                ? 'Adicionando...'
                : activeEdition?.available === 0
                ? 'Esgotado'
                : 'COMPRAR'}
            </button>

            <button
              type="button"
              onClick={() => {
                if (!isAuthenticated) {
                  toast({
                    title: 'Sign in required',
                    description: 'Please sign in to favorite NFTs.',
                  })
                  return
                }
                favoriteMutation.mutate()
              }}
              disabled={favoriteMutation.isPending}
              aria-label={nft.isFavorited ? 'Remove from favorites' : 'Add to favorites'}
              aria-pressed={nft.isFavorited}
              className={`h-10 px-4 rounded-lg border border-border bg-[#181009] flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer ${
                nft.isFavorited ? 'text-primary border-primary' : 'text-foreground hover:border-primary'
              }`}
            >
              <Heart
                className={`w-4 h-4 ${nft.isFavorited ? 'fill-primary text-primary' : ''}`}
                aria-hidden="true"
              />
              <span>Favoritar</span>
            </button>
          </div>

          <div className="pt-4 border-t border-border/60 space-y-2 text-xs font-mono">
            <div className="flex gap-2 text-muted-foreground">
              <span className="text-foreground font-semibold">ID do token:</span>
              <span>#{tokenNumber}</span>
            </div>
            <div className="flex gap-2 text-muted-foreground">
              <span className="text-foreground font-semibold">Coleção:</span>
              <span>{nft.collection}</span>
            </div>
            <div className="flex gap-2 text-muted-foreground">
              <span className="text-foreground font-semibold">Atributos:</span>
              <span>Óculos, Esmeralda, Raro</span>
            </div>
            <div className="flex items-center gap-3 pt-1 text-muted-foreground">
              <span className="text-foreground font-semibold">Compartilhar este NFT:</span>
              <a href="#" aria-label="LinkedIn" className="hover:text-primary transition-colors">
                <Linkedin className="w-3.5 h-3.5" />
              </a>
              <a href="#" aria-label="E-mail" className="hover:text-primary transition-colors">
                <Mail className="w-3.5 h-3.5" />
              </a>
              <a href="#" aria-label="Twitter" className="hover:text-primary transition-colors">
                <Twitter className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-border/60">
        <div className="flex items-center gap-8 border-b border-border/60 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`pb-3 text-sm font-semibold relative transition-colors cursor-pointer ${
              activeTab === 'details' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Detalhes do NFT
            {activeTab === 'details' && (
              <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-primary" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 text-sm font-semibold relative transition-colors cursor-pointer ${
              activeTab === 'reviews' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Avaliações de colecionadores (19)
            {activeTab === 'reviews' && (
              <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-primary" />
            )}
          </button>
        </div>

        {activeTab === 'details' ? (
          <div className="space-y-4 text-xs text-muted-foreground leading-relaxed max-w-3xl">
            <p>
              {nft.name} é uma obra digital finalizada à mão da coleção {nft.collection}. Cada atributo fica armazenado nos metadados do token e verificado na rede {nft.network}. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.
            </p>
            <p>
              A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. O criador {nft.creator.name} recebe 5% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.
            </p>
            <div className="pt-2 space-y-1.5 font-mono">
              <p>
                <strong className="text-foreground">Rede:</strong> Cunhado na {nft.network} com procedência imutável e metadados armazenados no IPFS.
              </p>
              <p>
                <strong className="text-foreground">Contrato:</strong> Direitos autorais do criador: 5% nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.
              </p>
              <p>
                <strong className="text-foreground">Direitos autorais:</strong> 0x7A42...19E8 · Contrato inteligente ERC-721 verificado.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground space-y-3">
            <p>19 colecionadores verificados avaliaram esta obra com nota 5/5.</p>
          </div>
        )}
      </div>

      <div className="pt-8">
        <h3 className="font-heading text-xl font-bold uppercase tracking-wider text-foreground mb-6">
          Mais desta coleção
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {(catalogData?.data ?? []).slice(0, 5).map((item) => (
            <NFTCard key={item.id} nft={item} />
          ))}
        </div>

        <div className="flex justify-center items-center gap-2 pt-6">
          <span className="w-2 h-2 rounded-full bg-[#382516]"></span>
          <span className="w-2 h-2 rounded-full bg-[#d67926]"></span>
          <span className="w-2 h-2 rounded-full bg-[#382516]"></span>
        </div>
      </div>
    </div>
  )
}

function NFTDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl" aria-hidden="true">
      <Skeleton className="h-4 w-32 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-6 flex gap-4">
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="w-16 h-16 rounded-xl" />
            ))}
          </div>
          <Skeleton className="flex-1 aspect-square rounded-2xl" />
        </div>
        <div className="lg:col-span-6 space-y-6">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}
