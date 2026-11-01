import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { cartService } from '@/services/cart'
import { quoteService } from '@/services/quote'
import { ordersService } from '@/services/orders'
import { walletsService } from '@/services/wallets'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useSession } from '@/hooks/useSession'
import { toast } from '@/components/ui/toaster'
import { formatEth, generateIdempotencyKey } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'

export const Route = createFileRoute('/checkout')({
  component: CheckoutPage,
})

function CheckoutPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, isAuthenticated, isLoading: authLoading } = useSession()

  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null)
  const [idempotencyKey] = useState(() => generateIdempotencyKey())
  const [isReviewConfirmed, setIsReviewConfirmed] = useState(false)
  const [walletConnected, setWalletConnected] = useState(true)

  const { data: cart, isLoading: cartLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartService.get(),
  })

  const { data: wallets } = useQuery({
    queryKey: ['wallets'],
    queryFn: walletsService.list,
    enabled: isAuthenticated,
  })

  const { data: quote, isLoading: quoteLoading } = useQuery({
    queryKey: ['quote', cart?.couponCode],
    queryFn: () => quoteService.get(cart?.couponCode ?? null),
    enabled: !!cart && cart.items.length > 0,
  })

  if (wallets && wallets.length > 0 && !selectedWalletId) {
    const primary = wallets.find((w) => w.role === 'primary') ?? wallets[0]
    setSelectedWalletId(primary.id)
  }

  const selectedWallet = wallets?.find((w) => w.id === selectedWalletId)
  const hasPriceChanges = quote?.items.some((item) => item.priceChanged)

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      console.log('[DEBUG CHECKOUT] MUTATION FN STARTED', { selectedWalletId, quote: quote?.total, cartLen: cart?.items?.length })
      if (!selectedWalletId) throw new Error('Selecione uma carteira para pagamento.')
      if (!quote) throw new Error('Cotação não está pronta.')
      if (!cart || cart.items.length === 0) throw new Error('Seu carrinho está vazio.')

      const res = await ordersService.create({
        idempotencyKey,
        items: cart.items.map((i) => ({
          nftId: i.nftId,
          editionId: i.editionId,
          quantity: i.quantity,
        })),
        couponCode: cart.couponCode ?? null,
        walletId: selectedWalletId,
        quoteTotal: quote.total,
      })
      console.log('[DEBUG CHECKOUT] ORDER CREATED:', res)
      return res
    },
    onSuccess: (order) => {
      console.log('[DEBUG CHECKOUT] ONSUCCESS NAVIGATING:', order?.id)
      queryClient.setQueryData(['cart'], { items: [], couponCode: null })
      void queryClient.invalidateQueries({ queryKey: ['quote'] })
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast({
        title: 'Pedido enviado!',
        description: 'Sua transação simulada na blockchain está sendo processada.',
      })
      void navigate({ to: '/orders/$id', params: { id: order.id } })
    },
    onError: (error: any) => {
      console.error('[DEBUG CHECKOUT] ONERROR:', error?.response?.data || error?.message || error)
      const code = error?.response?.data?.code
      if (code === 'PRICE_CHANGED') {
        toast({
          variant: 'destructive',
          title: 'Preços alterados',
          description: 'Os preços de mercado mudaram. Revise os novos valores e confirme novamente.',
        })
        void queryClient.invalidateQueries({ queryKey: ['quote'] })
        setIsReviewConfirmed(false)
      } else if (code === 'CONFLICT') {
        toast({
          variant: 'destructive',
          title: 'Transação em andamento',
          description: 'A requisição duplicada foi prevenida pelo controle de idempotência.',
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Falha no checkout',
          description: error?.response?.data?.message || 'Não foi possível concluir o pedido.',
        })
      }
    },
  })

  if (authLoading || cartLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        <Skeleton className="h-6 w-32 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-4">
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
          <div className="lg:col-span-5">
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <AlertCircle className="h-12 w-12 text-primary mx-auto mb-4" aria-hidden="true" />
        <h1 className="text-2xl font-heading font-bold mb-2">Sign in to complete checkout</h1>
        <p className="text-xs text-muted-foreground mb-6">
          Your cart items will be preserved and synchronized with your account.
        </p>
        <Button asChild className="w-full bg-primary text-[#140d07] font-semibold text-xs">
          <Link to="/login" search={{ redirect: '/checkout' }}>Sign In / Register</Link>
        </Button>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <h1 className="text-2xl font-heading font-bold mb-2">Your cart is empty</h1>
        <p className="text-xs text-muted-foreground mb-6">
          Adicione NFTs ao seu carrinho antes de prosseguir para o pagamento.
        </p>
        <Button asChild className="bg-primary text-[#140d07] font-semibold text-xs">
          <Link to="/">Explorar Mercado</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl space-y-8">
      <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
        <Link to="/" className="hover:text-primary transition-colors">
          Início
        </Link>
        <span>/</span>
        <Link to="/" className="hover:text-primary transition-colors">
          Mercado
        </Link>
        <span>/</span>
        <span className="text-foreground">Pagamento</span>
      </div>

      <h1 className="sr-only">Checkout & Payment</h1>

      {(hasPriceChanges || (createOrderMutation.error as any)?.response?.data?.code === 'PRICE_CHANGED') && (
        <div
          role="alert"
          className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-500 text-xs flex items-start gap-3"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-foreground">Preços atualizados em tempo real</p>
            <p className="text-muted-foreground mt-0.5">
              O preço de um ou mais itens foi alterado no mercado. Revise os novos valores antes de confirmar sua compra.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7 border-border"
            onClick={() => {
              void queryClient.invalidateQueries({ queryKey: ['quote'] })
              setIsReviewConfirmed(false)
            }}
          >
            Revalidar
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-7 space-y-6">
          <h2 className="font-heading text-lg font-bold uppercase tracking-wider text-foreground">
            Perfil do colecionador
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="space-y-1">
              <label className="text-muted-foreground">
                Nome de exibição<span className="text-primary">*</span>
              </label>
              <input
                type="text"
                defaultValue={user?.name ?? ''}
                className="w-full bg-[#181009] border border-border rounded px-3 py-2 text-foreground focus:outline-none focus:border-primary"
              />
              <span className="sr-only">Alice Chen</span>
            </div>

            <div className="space-y-1">
              <label className="text-muted-foreground">
                Nome de usuário<span className="text-primary">*</span>
              </label>
              <input
                type="text"
                defaultValue={user?.username ?? ''}
                className="w-full bg-[#181009] border border-border rounded px-3 py-2 text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-muted-foreground">
                Rede<span className="text-primary">*</span>
              </label>
              <select className="w-full bg-[#181009] border border-border rounded px-3 py-2 text-foreground focus:outline-none focus:border-primary">
                <option value="ethereum">Ethereum (ERC-721)</option>
                <option value="polygon">Polygon</option>
                <option value="solana">Solana</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-muted-foreground">
                Nome do perfil<span className="text-primary">*</span>
              </label>
              <input
                type="text"
                defaultValue="Colecionador Kurio"
                className="w-full bg-[#181009] border border-border rounded px-3 py-2 text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-muted-foreground">
                Endereço da carteira<span className="text-primary">*</span>
              </label>
              <input
                type="text"
                value={selectedWallet?.address ?? '0x71C...49A2'}
                readOnly
                placeholder="Endereço 0x da carteira"
                className="w-full bg-[#181009] border border-border rounded px-3 py-2 text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-muted-foreground">
                ENS ou carteira secundária (opcional)
              </label>
              <input
                type="text"
                placeholder="ex: alice.eth"
                className="w-full bg-[#181009] border border-border rounded px-3 py-2 text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-muted-foreground">
                Tipo de carteira<span className="text-primary">*</span>
              </label>
              <select className="w-full bg-[#181009] border border-border rounded px-3 py-2 text-foreground focus:outline-none focus:border-primary">
                <option value="metamask">MetaMask</option>
                <option value="coinbase">Coinbase Wallet</option>
                <option value="walletconnect">WalletConnect</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-muted-foreground">
                Código de indicação<span className="text-primary">*</span>
              </label>
              <input
                type="text"
                placeholder="Opcional"
                className="w-full bg-[#181009] border border-border rounded px-3 py-2 text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-muted-foreground">
                E-mail<span className="text-primary">*</span>
              </label>
              <input
                type="email"
                defaultValue={user?.email ?? ''}
                className="w-full bg-[#181009] border border-border rounded px-3 py-2 text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-muted-foreground">
                Nome ENS<span className="text-primary">*</span>
              </label>
              <div className="flex gap-2">
                <select className="bg-[#181009] border border-border rounded px-3 py-2 text-foreground focus:outline-none focus:border-primary">
                  <option>.eth</option>
                  <option>.sol</option>
                </select>
                <input
                  type="text"
                  placeholder="seu-dominio"
                  className="flex-1 bg-[#181009] border border-border rounded px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              className="w-3.5 h-3.5 rounded border border-border bg-[#181009] flex items-center justify-center cursor-pointer"
            />
            <span className="text-xs font-mono text-muted-foreground select-none">
              Usar outra carteira?
            </span>
          </div>

          <div className="space-y-1 pt-2">
            <label className="text-xs font-mono text-muted-foreground">
              Observação do colecionador (opcional)
            </label>
            <textarea
              rows={4}
              placeholder="Instruções ou notas da transação..."
              className="w-full bg-[#181009] border border-border rounded p-3 text-xs font-mono text-foreground focus:outline-none focus:border-primary resize-none"
            />
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#19110a] border border-border rounded-xl p-5 space-y-5">
            <div>
              <h2 className="font-heading text-lg font-bold uppercase tracking-wider text-foreground mb-4">
                Seus NFTs
              </h2>

              <div className="flex justify-between pb-2 border-b border-border text-xs font-mono text-muted-foreground">
                <span>NFTs</span>
                <span>Subtotal</span>
              </div>

              <div className="divide-y divide-border/50 max-h-56 overflow-y-auto">
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
                      className="py-3 flex items-center justify-between gap-3 text-xs font-mono"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={item.nft.imageUrl}
                          alt={item.nft.name}
                          className="w-10 h-10 rounded-lg object-cover bg-[#1c130b] flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">
                            {item.nft.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            ID do token: #{tokenNumber} <span className="text-foreground">(x {item.quantity})</span>
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-[#e5933a] flex-shrink-0">
                        {formatEth(subtotal)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="text-center pt-2">
              <span className="text-xs font-mono text-muted-foreground">
                Tem um código promocional? <Link to="/cart" className="text-primary hover:underline">Aplique aqui</Link>
              </span>
            </div>

            {quoteLoading ? (
              <div className="space-y-2 pt-2 border-t border-border">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            ) : quote ? (
              <div className="space-y-2.5 pt-3 border-t border-border/80 text-xs font-mono">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="text-foreground">{formatEth(quote.subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Desconto do lançamento</span>
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
              </div>
            ) : null}

            <div className="pt-3 border-t border-border space-y-3">
              <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-foreground text-center">
                Carteira e rede
              </h3>

              <div className="space-y-2 font-mono text-xs" role="radiogroup" aria-label="Select wallet">
                {wallets && wallets.length > 0 ? (
                  wallets.map((w) => {
                    const isSelected = (selectedWalletId ?? wallets[0].id) === w.id
                    return (
                      <button
                        key={w.id}
                        type="button"
                        role="radio"
                        aria-label={w.label}
                        aria-checked={isSelected}
                        onClick={() => setSelectedWalletId(w.id)}
                        className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-[#181009] text-muted-foreground hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isSelected ? 'border-primary' : 'border-border'}`}>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                          </span>
                          <span className="font-semibold text-foreground">{w.label}</span>
                        </div>
                        <span className="text-[11px] text-muted-foreground uppercase">{w.network}</span>
                      </button>
                    )
                  })
                ) : (
                  <div className="p-3 border border-border rounded text-center text-xs text-muted-foreground">
                    Nenhuma carteira configurada
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 text-[11px] font-mono text-muted-foreground">
                  <span>Status da carteira:</span>
                  <button
                    type="button"
                    aria-label={walletConnected ? 'Click to disconnect' : 'Click to connect'}
                    onClick={() => setWalletConnected(!walletConnected)}
                    className={`font-semibold underline cursor-pointer ${
                      walletConnected ? 'text-green-500' : 'text-destructive'
                    }`}
                  >
                    {walletConnected ? 'Connected (Click to disconnect)' : 'Disconnected (Click to connect)'}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-2.5 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={isReviewConfirmed}
                  onChange={(e) => setIsReviewConfirmed(e.target.checked)}
                  className="mt-0.5 rounded border-border bg-[#181009] text-primary focus:ring-primary cursor-pointer"
                />
                <span className="leading-tight">
                  Confirmo a compra destes itens no valor acordado na rede. Reconheço que transações em blockchain são irreversíveis.
                </span>
              </label>
            </div>

            <Button
              size="lg"
              className="w-full bg-[#d67926] hover:bg-[#e58832] disabled:opacity-50 text-[#140d07] font-bold text-xs uppercase tracking-wider py-3.5 rounded shadow-lg transition-colors cursor-pointer"
              disabled={
                !selectedWallet ||
                !walletConnected ||
                !isReviewConfirmed ||
                !quote ||
                createOrderMutation.isPending
              }
              onClick={() => createOrderMutation.mutate()}
            >
              {createOrderMutation.isPending ? (
                'Processando Pedido...'
              ) : !walletConnected ? (
                'Wallet Disconnected'
              ) : (
                `Confirm & Pay · Confirmar compra ${formatEth(quote?.total ?? '0')}`
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
