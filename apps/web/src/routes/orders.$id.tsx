import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ordersService } from '@/services/orders'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Mail, XCircle, Clock, X, RotateCcw } from 'lucide-react'
import { formatEth } from '@/lib/utils'

export const Route = createFileRoute('/orders/$id')({
  component: OrderConfirmationPage,
})

function OrderConfirmationPage() {
  const { id } = Route.useParams()

  const { data: order, isLoading, isError, error } = useQuery({
    queryKey: ['orders', id],
    queryFn: () => ordersService.getById(id),
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? 1000 : false),
  })

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-xl">
        <Skeleton className="h-[520px] w-full rounded-2xl" />
      </div>
    )
  }

  if (isError || !order) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md" role="alert">
        <h1 className="text-2xl font-heading font-bold mb-2">Order Not Found</h1>
        <p className="text-xs text-muted-foreground mb-6">
          {(error as any)?.response?.data?.message ||
            'The requested order could not be found or you do not have permission to view it.'}
        </p>
        <Button asChild className="bg-primary text-[#140d07] font-semibold text-xs">
          <Link to="/">Go to Marketplace</Link>
        </Button>
      </div>
    )
  }

  const txHashShort = order.transactionHash
    ? `${order.transactionHash.slice(0, 6)}...${order.transactionHash.slice(-4)}`
    : '0xA91F...E82C'

  const formattedDate = new Date(order.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  const isDeclined = order.status === 'declined'
  const isPending = order.status === 'pending'
  const isConfirmed = order.status === 'confirmed'

  return (
    <div className="container mx-auto px-4 py-10 max-w-xl flex justify-center">
      <div className={`w-full bg-[#1c130b] border ${isDeclined ? 'border-destructive/60' : 'border-border'} rounded-xl shadow-2xl relative overflow-hidden flex flex-col`}>
        <Link
          to="/"
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors z-10"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </Link>

        <div className="p-6 text-center space-y-3">
          {isConfirmed && (
            <>
              <div className="w-14 h-14 mx-auto rounded-xl border border-primary/40 bg-primary/10 flex flex-col items-center justify-center text-primary relative">
                <Mail className="w-6 h-6 stroke-[1.8]" />
                <span className="text-[7px] font-mono font-bold tracking-tighter uppercase mt-0.5">
                  THANK YOU
                </span>
              </div>

              <div>
                <h1 className="font-heading text-lg font-bold text-foreground">
                  Seus NFTs agora estão na sua carteira
                </h1>
                <p className="sr-only">Receipt Snapshot</p>
              </div>
            </>
          )}

          {isPending && (
            <>
              <div className="w-14 h-14 mx-auto rounded-xl border border-amber-500/40 bg-amber-500/10 flex flex-col items-center justify-center text-amber-500 relative animate-pulse">
                <Clock className="w-6 h-6 animate-spin" />
                <span className="text-[7px] font-mono font-bold tracking-tighter uppercase mt-0.5">
                  PROCESSANDO
                </span>
              </div>

              <div>
                <h1 className="font-heading text-lg font-bold text-foreground">
                  Processando Transação na Blockchain...
                </h1>
                <p className="text-xs text-amber-500 font-mono mt-1">Aguardando confirmação simulada (2s)...</p>
                <p className="sr-only">Receipt Snapshot</p>
              </div>
            </>
          )}

          {isDeclined && (
            <>
              <div className="w-14 h-14 mx-auto rounded-xl border border-destructive/40 bg-destructive/10 flex flex-col items-center justify-center text-destructive relative">
                <XCircle className="w-7 h-7" />
                <span className="text-[7px] font-mono font-bold tracking-tighter uppercase mt-0.5">
                  FALHA
                </span>
              </div>

              <div>
                <h1 className="font-heading text-lg font-bold text-destructive">
                  Pagamento Recusado
                  <span className="sr-only">Payment Declined</span>
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  A transação não pôde ser concluída na rede. Nenhum valor foi debitado da sua carteira.
                </p>
                <p className="sr-only">Receipt Snapshot</p>
              </div>
            </>
          )}
        </div>

        <div className="border-y border-border/80 px-6 py-3 grid grid-cols-4 gap-2 text-center text-xs font-mono">
          <div>
            <p className="text-[10px] text-muted-foreground">ID da transação</p>
            <p className="font-semibold text-foreground truncate mt-0.5">
              {isConfirmed ? txHashShort : isPending ? 'Pendente...' : 'Cancelada'}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Data</p>
            <p className="font-semibold text-foreground mt-0.5">{formattedDate}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Total</p>
            <p className={`font-semibold mt-0.5 ${isDeclined ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
              {formatEth(order.total)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Carteira</p>
            <p className="font-semibold text-foreground truncate mt-0.5 capitalize">
              {order.walletNetwork || 'MetaMask'}
            </p>
          </div>
        </div>

        <div className="p-6 space-y-4 flex-1">
          <div>
            <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-foreground mb-3">
              Detalhes da transação
              <span className="sr-only"> Transaction Information</span>
            </h2>

            <div className="grid grid-cols-12 pb-2 text-[11px] font-mono font-bold text-muted-foreground uppercase border-b border-border/60">
              <span className="col-span-6">NFTs</span>
              <span className="col-span-3 text-center">Edições</span>
              <span className="col-span-3 text-right">Subtotal</span>
            </div>

            <div className="divide-y divide-border/40 max-h-48 overflow-y-auto">
              {order.items.map((item, idx) => {
                const tokenNumber = item.nftId.replace(/\D/g, '').padStart(4, '0')
                return (
                  <div
                    key={idx}
                    className="grid grid-cols-12 py-2.5 items-center gap-2 text-xs font-mono"
                  >
                    <div className="col-span-6 flex items-center gap-2.5 min-w-0">
                      <img
                        src={item.imageUrl}
                        alt={item.nftName}
                        className="w-9 h-9 rounded object-cover bg-[#25190f] flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{item.nftName}</p>
                        <p className="text-[10px] text-muted-foreground">ID do token: #{tokenNumber}</p>
                      </div>
                    </div>

                    <div className="col-span-3 text-center text-muted-foreground">
                      (x {item.quantity})
                    </div>

                    <div className="col-span-3 text-right font-bold text-[#e5933a]">
                      {formatEth(item.subtotal)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-border/80 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-muted-foreground">
              <span>Taxa de rede</span>
              <span className="text-foreground">{formatEth(order.networkFee)}</span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="font-heading uppercase tracking-wider text-sm font-bold text-foreground">
                Total
              </span>
              <span className={`text-lg font-bold ${isDeclined ? 'text-destructive line-through' : 'text-[#e5933a]'}`}>
                {formatEth(order.total)}
              </span>
            </div>
          </div>

          {isConfirmed && (
            <p className="text-[11px] text-muted-foreground text-center leading-relaxed pt-2">
              Transação confirmada na Ethereum. A propriedade foi transferida para sua carteira conectada e registrada na rede.
            </p>
          )}

          {isPending && (
            <p className="text-[11px] text-amber-500/90 text-center leading-relaxed pt-2 font-mono">
              Validando blocos e assinaturas criptográficas na rede simulada...
            </p>
          )}

          {isDeclined && (
            <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-center text-xs leading-relaxed">
              Falha na simulação: a transação foi recusada (conforme definido no painel de Cenários de Teste). O estoque e o saldo não foram alterados.
            </div>
          )}

          <div className="pt-2">
            {isConfirmed && (
              <a
                href={order.explorerUrl ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#d67926] hover:bg-[#e58832] text-[#140d07] font-bold text-xs uppercase tracking-wider py-2.5 rounded text-center block transition-colors shadow-md cursor-pointer"
              >
                Ver no Etherscan
              </a>
            )}

            {isDeclined && (
              <div className="flex gap-2">
                <Link
                  to="/checkout"
                  className="flex-1 bg-destructive hover:bg-destructive/90 text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded text-center flex items-center justify-center gap-1.5 transition-colors shadow-md"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Tentar novamente</span>
                </Link>
                <Link
                  to="/"
                  className="px-4 py-2.5 rounded border border-border text-xs text-muted-foreground hover:text-foreground text-center"
                >
                  Catálogo
                </Link>
              </div>
            )}

            {isPending && (
              <div className="w-full bg-border/40 text-muted-foreground font-mono text-xs py-2.5 rounded text-center">
                Aguardando resposta da rede...
              </div>
            )}
          </div>
        </div>

        <div className={`h-1.5 w-full ${isDeclined ? 'bg-destructive' : isPending ? 'bg-amber-500 animate-pulse' : 'bg-[#d67926]'}`} />
      </div>
    </div>
  )
}
