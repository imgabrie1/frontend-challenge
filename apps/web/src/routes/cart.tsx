import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { cartService } from '@/services/cart'
import { quoteService } from '@/services/quote'
import { nftsService } from '@/services/nfts'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/toaster'
import { Trash2, ShoppingBag, Minus, Plus, AlertTriangle } from 'lucide-react'
import { formatEth } from '@/lib/utils'
import { NFTCard } from '@/features/catalog/NFTCard'

export const Route = createFileRoute('/cart')({
  component: CartPage,
})

function CartPage() {
  const queryClient = useQueryClient()
  const [couponInput, setCouponInput] = useState('')

  const { data: cart, isLoading: cartLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartService.get(),
  })

  const { data: quote, isLoading: quoteLoading } = useQuery({
    queryKey: ['quote', cart?.couponCode],
    queryFn: () => quoteService.get(cart?.couponCode ?? null),
    enabled: !!cart && cart.items.length > 0,
  })

  const { data: catalogData } = useQuery({
    queryKey: ['nfts', { limit: 5 }],
    queryFn: () => nftsService.list({ limit: 5 }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ nftId, editionId, quantity }: { nftId: string; editionId: string; quantity: number }) =>
      cartService.updateItem(nftId, editionId, quantity),
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data)
      void queryClient.invalidateQueries({ queryKey: ['quote'] })
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Falha na atualização',
        description: err?.response?.data?.message || 'Não foi possível atualizar a quantidade.',
      })
    },
  })

  const removeMutation = useMutation({
    mutationFn: ({ nftId, editionId }: { nftId: string; editionId: string }) =>
      cartService.removeItem(nftId, editionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cart'] })
      void queryClient.invalidateQueries({ queryKey: ['quote'] })
      toast({ title: 'Item removido', description: 'Item removido do seu carrinho.' })
    },
  })

  const couponMutation = useMutation({
    mutationFn: (code: string) => cartService.applyCoupon(code),
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data)
      void queryClient.invalidateQueries({ queryKey: ['quote'] })
      setCouponInput('')
      toast({
        title: 'Coupon applied!',
        description: `Código promocional ${data.couponCode} aplicado com sucesso.`,
      })
    },
    onError: (error: any) => {
      const errType = error?.response?.data?.error
      const msg =
        errType === 'expired'
          ? 'Este cupom expirou.'
          : 'Cupom inválido. Tente SAVE10 ou SAVE20.'
      toast({
        variant: 'destructive',
        title: 'Coupon Error',
        description: msg,
      })
    },
  })

  const removeCouponMutation = useMutation({
    mutationFn: cartService.removeCoupon,
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data)
      void queryClient.invalidateQueries({ queryKey: ['quote'] })
      toast({ title: 'Cupom removido' })
    },
  })

  if (cartLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        <h1 className="text-3xl font-heading font-extrabold">Shopping Cart</h1>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
          <div className="lg:col-span-4">
            <Skeleton className="h-72 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-[#1c130b] border border-border flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-heading font-bold mb-2">Your cart is empty</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Você ainda não adicionou nenhum colecionável digital ao seu carrinho.
        </p>
        <Button asChild className="bg-primary text-[#140d07] font-semibold text-xs">
          <Link to="/">Explore Marketplace</Link>
        </Button>
      </div>
    )
  }

  const hasIssues = quote?.items.some((item) => item.priceChanged || item.insufficientStock)

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl space-y-12">
      <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
        <Link to="/" className="hover:text-primary transition-colors">
          Início
        </Link>
        <span>/</span>
        <Link to="/" className="hover:text-primary transition-colors">
          Mercado
        </Link>
        <span>/</span>
        <span className="text-foreground">Carrinho</span>
      </div>

      <h1 className="sr-only">Shopping Cart ({cart.items.length})</h1>

      {hasIssues && (
        <div
          role="alert"
          className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-500 text-xs flex items-start gap-3"
        >
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-semibold">Itens no carrinho foram atualizados no mercado</p>
            <p className="text-amber-400/90 mt-0.5">
              Preços ou disponibilidade mudaram. Revise os valores atualizados antes de finalizar a compra.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8">
          <div className="grid grid-cols-12 pb-3 border-b border-border text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider">
            <span className="col-span-6">NFTs</span>
            <span className="col-span-2 text-center">Preço</span>
            <span className="col-span-2 text-center">Edições</span>
            <span className="col-span-2 text-right">Total</span>
          </div>

          <div className="divide-y divide-border/60">
            {cart.items.map((item) => {
              const quoteItem = quote?.items.find(
                (q) => q.nftId === item.nftId && q.editionId === item.editionId,
              )
              const itemPrice = quoteItem?.unitPrice ?? item.edition.price
              const subtotal = (parseFloat(itemPrice) * item.quantity).toFixed(2)
              const tokenNumber = item.nft.id.replace(/\D/g, '').padStart(4, '0')

              return (
                <div
                  key={`${item.nftId}-${item.editionId}`}
                  className="grid grid-cols-12 py-4 items-center gap-2"
                >
                  <div className="col-span-6 flex items-center gap-3 min-w-0">
                    <Link to="/nfts/$id" params={{ id: item.nftId }} className="flex-shrink-0">
                      <img
                        src={item.nft.imageUrl}
                        alt={item.nft.name}
                        className="w-14 h-14 rounded-lg object-cover border border-border bg-[#1c130b] hover:opacity-80 transition-opacity"
                      />
                    </Link>
                    <div className="min-w-0">
                      <Link
                        to="/nfts/$id"
                        params={{ id: item.nftId }}
                        className="font-semibold text-sm text-foreground hover:text-primary transition-colors truncate block"
                      >
                        {item.nft.name}
                      </Link>
                      <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                        ID do token: #{tokenNumber}
                      </p>
                    </div>
                  </div>

                  <div className="col-span-2 text-center font-mono text-xs text-foreground">
                    {formatEth(itemPrice)}
                  </div>

                  <div className="col-span-2 flex items-center justify-center">
                    <div className="flex items-center border border-border bg-[#181009] rounded h-7 px-1">
                      <button
                        type="button"
                        onClick={() =>
                          updateMutation.mutate({
                            nftId: item.nftId,
                            editionId: item.editionId,
                            quantity: Math.max(1, item.quantity - 1),
                          })
                        }
                        disabled={item.quantity <= 1 || updateMutation.isPending}
                        aria-label="Decrease quantity"
                        className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="w-6 text-center text-xs font-mono font-bold" aria-live="polite">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateMutation.mutate({
                            nftId: item.nftId,
                            editionId: item.editionId,
                            quantity: item.quantity + 1,
                          })
                        }
                        disabled={
                          (quoteItem ? item.quantity >= quoteItem.available : false) ||
                          updateMutation.isPending
                        }
                        aria-label="Increase quantity"
                        className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-3 font-mono text-xs">
                    <span className="font-bold text-foreground">
                      {formatEth(subtotal)}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        removeMutation.mutate({
                          nftId: item.nftId,
                          editionId: item.editionId,
                        })
                      }
                      disabled={removeMutation.isPending}
                      aria-label={`Remove ${item.nft.name} from cart`}
                      className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="lg:col-span-4 bg-[#19110a] border border-border rounded-xl p-5 space-y-5">
          <h2 className="font-heading text-lg font-bold uppercase tracking-wider text-foreground">
            Resumo da carteira
          </h2>

          <div className="space-y-1.5">
            <label htmlFor="coupon-input" className="text-xs font-mono text-muted-foreground">
              Código promocional
            </label>
            {cart.couponCode ? (
              <div className="flex items-center justify-between p-2 rounded border border-primary/40 bg-primary/10 text-primary text-xs font-mono">
                <span>{cart.couponCode} applied</span>
                <button
                  type="button"
                  onClick={() => removeCouponMutation.mutate()}
                  className="text-muted-foreground hover:text-destructive cursor-pointer font-bold px-1"
                >
                  ×
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (couponInput.trim()) couponMutation.mutate(couponInput.trim())
                }}
                className="flex gap-2"
              >
                <input
                  id="coupon-input"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Digite o código promocional..."
                  className="flex-1 bg-[#120a05] border border-border rounded px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary font-mono"
                />
                <button
                  type="submit"
                  aria-label="Apply"
                  disabled={couponMutation.isPending || !couponInput.trim()}
                  className="bg-[#d67926] hover:bg-[#e58832] disabled:opacity-50 text-[#140d07] font-semibold text-xs px-3 py-1.5 rounded transition-colors cursor-pointer"
                >
                  Aplicar
                </button>
              </form>
            )}
          </div>

          {quoteLoading ? (
            <div className="space-y-2 pt-2 border-t border-border">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          ) : quote ? (
            <div className="space-y-3 pt-3 border-t border-border/80 text-xs font-mono">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="text-foreground">{formatEth(quote.subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Desconto do lançamento (Coupon Discount)</span>
                <span className="text-foreground">
                  {quote.couponApplied ? `(-) ${formatEth(quote.discount)}` : '(-) 00.00'}
                </span>
              </div>
              <div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Taxa de rede</span>
                  <span className="text-foreground">{formatEth(quote.networkFee)}</span>
                </div>
                <span className="text-[10px] text-muted-foreground block text-right">
                  Taxa estimada
                </span>
              </div>

              <div className="pt-3 border-t border-border flex items-baseline justify-between">
                <span className="font-heading uppercase tracking-wider text-base font-bold text-foreground">
                  Total
                </span>
                <span className="text-xl font-bold text-[#e5933a]">
                  {formatEth(quote.total)}
                </span>
              </div>

              <div className="pt-2 space-y-2">
                <Link
                  to="/checkout"
                  aria-label="Proceed to Checkout"
                  className="w-full bg-[#d67926] hover:bg-[#e58832] text-[#140d07] font-bold text-xs uppercase tracking-wider py-3 rounded text-center block transition-colors shadow-md"
                >
                  Conectar e finalizar
                </Link>
                <div className="text-center pt-1">
                  <Link
                    to="/"
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Continuar explorando
                  </Link>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="pt-10 border-t border-border/60">
        <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-foreground mb-6">
          Colecionadores também viram
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
