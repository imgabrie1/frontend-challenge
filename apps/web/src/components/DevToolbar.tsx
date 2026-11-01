import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toaster'
import {
  Wrench,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  LogOut,
} from 'lucide-react'

export function DevToolbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, login, logout } = useSession()
  const queryClient = useQueryClient()

  const [orderOutcome, setOrderOutcome] = useState<'auto' | 'confirmed' | 'declined'>('auto')
  const [networkSpeed, setNetworkSpeed] = useState<'normal' | 'slow'>('normal')

  useEffect(() => {
    const savedOutcome = localStorage.getItem('msw_force_order_status') as 'confirmed' | 'declined' | null
    if (savedOutcome) setOrderOutcome(savedOutcome)

    const savedSpeed = localStorage.getItem('msw_network_speed') as 'normal' | 'slow' | null
    if (savedSpeed) setNetworkSpeed(savedSpeed)
  }, [])

  const handleOrderOutcomeChange = (val: 'auto' | 'confirmed' | 'declined') => {
    setOrderOutcome(val)
    if (val === 'auto') {
      localStorage.removeItem('msw_force_order_status')
    } else {
      localStorage.setItem('msw_force_order_status', val)
    }
    toast({
      title: 'Cenário de Pagamento',
      description: val === 'auto' ? 'Resultado aleatório padrão (85% sucesso)' : `Próximo pedido será: ${val}`,
    })
  }

  const handleNetworkSpeedChange = (val: 'normal' | 'slow') => {
    setNetworkSpeed(val)
    localStorage.setItem('msw_network_speed', val)
    toast({
      title: 'Velocidade da Rede',
      description: val === 'slow' ? 'Latência simulada de 2.5s ativada (veja os skeletons)' : 'Latência normal (150ms)',
    })
  }

  const handleResetData = () => {
    if (window.confirm('Deseja resetar todos os dados mockados (carrinho, carteiras, pedidos) para o estado original?')) {
      localStorage.clear()
      sessionStorage.clear()
      void queryClient.clear()
      toast({
        title: 'Dados Resetados',
        description: 'Restaurando fixtures originais...',
      })
      setTimeout(() => {
        window.location.href = '/'
      }, 300)
    }
  }

  const handleSimulatePriceChange = () => {
    window.dispatchEvent(
      new CustomEvent('msw:nft_updated', {
        detail: {
          nftId: 'nft-1',
          version: Date.now(),
          changes: {
            editionId: 'edition-1-standard',
            price: (Math.random() * 0.5 + 0.1).toFixed(4),
            available: 4,
          },
        },
      }),
    )
    toast({
      title: 'Tempo Real: nft.updated',
      description: 'Preço do NFT Cosmic Drift #1 atualizado via Socket.IO!',
    })
  }

  const handleQuickLogin = (email: string) => {
    const isAlice = email.includes('alice')
    login(
      {
        id: isAlice ? 'user-alice' : 'user-bob',
        email,
        name: isAlice ? 'Alice Chen' : 'Bob Martinez',
        username: isAlice ? 'alice_chen' : 'bob_m',
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${isAlice ? 'alice' : 'bob'}`,
        bio: isAlice ? 'Digital art collector' : 'NFT trader',
        createdAt: '2024-01-15T10:00:00Z',
      },
      `mock-token-${isAlice ? 'alice' : 'bob'}-${Date.now()}`,
    )
    toast({
      title: 'Sessão Alterada',
      description: `Autenticado como ${isAlice ? 'Alice' : 'Bob'}`,
    })
  }

  return (
    <aside
      aria-label="Painel de Simulação de Cenários"
      className="fixed bottom-4 right-4 z-50 flex flex-col items-end print:hidden"
    >
      {isOpen && (
        <div className="mb-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-primary/30 bg-background/95 p-4 shadow-2xl backdrop-blur-md space-y-4 text-xs animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <Wrench className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>Cenários de Teste (MSW & Realtime)</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Fechar painel de cenários"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            <span className="font-semibold text-muted-foreground block">
              1. Tempo Real (Socket.IO)
            </span>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs justify-start h-8 cursor-pointer"
              onClick={handleSimulatePriceChange}
            >
              <Zap className="h-3.5 w-3.5 text-amber-500 mr-1.5" />
              <span>Simular alteração de preço no NFT-1</span>
            </Button>
          </div>

          <div className="space-y-1.5">
            <span className="font-semibold text-muted-foreground block">
              2. Simulação de Pagamento
            </span>
            <div className="grid grid-cols-3 gap-1">
              <Button
                variant={orderOutcome === 'auto' ? 'default' : 'outline'}
                size="sm"
                className="text-[11px] h-7 px-1"
                onClick={() => handleOrderOutcomeChange('auto')}
              >
                Auto (85%)
              </Button>
              <Button
                variant={orderOutcome === 'confirmed' ? 'default' : 'outline'}
                size="sm"
                className="text-[11px] h-7 px-1 text-green-600 dark:text-green-400"
                onClick={() => handleOrderOutcomeChange('confirmed')}
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Sucesso
              </Button>
              <Button
                variant={orderOutcome === 'declined' ? 'default' : 'outline'}
                size="sm"
                className="text-[11px] h-7 px-1 text-destructive"
                onClick={() => handleOrderOutcomeChange('declined')}
              >
                <XCircle className="h-3 w-3 mr-1" />
                Recusar
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="font-semibold text-muted-foreground block">
              3. Condições de Rede (MSW)
            </span>
            <div className="grid grid-cols-2 gap-1">
              <Button
                variant={networkSpeed === 'normal' ? 'default' : 'outline'}
                size="sm"
                className="text-[11px] h-7"
                onClick={() => handleNetworkSpeedChange('normal')}
              >
                Normal (150ms)
              </Button>
              <Button
                variant={networkSpeed === 'slow' ? 'default' : 'outline'}
                size="sm"
                className="text-[11px] h-7"
                onClick={() => handleNetworkSpeedChange('slow')}
              >
                <Clock className="h-3 w-3 mr-1" />
                Lenta (2.5s)
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="font-semibold text-muted-foreground block">
              4. Alternar Usuário ({user ? user.name : 'Visitante'})
            </span>
            <div className="grid grid-cols-3 gap-1">
              <Button
                variant="outline"
                size="sm"
                className="text-[11px] h-7 px-1"
                onClick={() => handleQuickLogin('alice@nftmarket.dev')}
              >
                <User className="h-3 w-3 mr-1" />
                Alice
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-[11px] h-7 px-1"
                onClick={() => handleQuickLogin('bob@nftmarket.dev')}
              >
                <User className="h-3 w-3 mr-1" />
                Bob
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-[11px] h-7 px-1"
                onClick={logout}
              >
                <LogOut className="h-3 w-3 mr-1" />
                Sair
              </Button>
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <Button
              variant="destructive"
              size="sm"
              className="w-full text-xs h-8 cursor-pointer"
              onClick={handleResetData}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              <span>Resetar Dados para Estado Padrão</span>
            </Button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-full border border-primary/40 bg-card px-3.5 py-2 text-xs font-semibold text-foreground shadow-lg hover:border-primary hover:bg-primary/10 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-expanded={isOpen}
      >
        <Wrench className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        <span>Cenários de Teste</span>
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>
    </aside>
  )
}
