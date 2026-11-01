import { createFileRoute, Link } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { walletsService } from '@/services/wallets'
import { useSession } from '@/hooks/useSession'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toaster'
import { Skeleton } from '@/components/ui/skeleton'
import { Wallet, Plus, Edit2, AlertCircle, X } from 'lucide-react'
import type { Wallet as WalletType } from '@/types'

const walletSchema = z.object({
  address: z
    .string()
    .min(10, 'Wallet address must be at least 10 characters')
    .regex(/^0x[a-fA-F0-9]{40}$|^[1-9A-HJ-NP-Za-km-z]{32,44}$/, 'Invalid wallet address format'),
  label: z.string().min(2, 'Label must be at least 2 characters'),
  network: z.enum(['ethereum', 'polygon', 'solana']),
  role: z.enum(['primary', 'secondary']),
})

type WalletForm = z.infer<typeof walletSchema>

export const Route = createFileRoute('/wallets')({
  component: WalletsPage,
})

function WalletsPage() {
  const { isAuthenticated, isLoading: authLoading } = useSession()
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingWallet, setEditingWallet] = useState<WalletType | null>(null)

  const { data: wallets, isLoading } = useQuery({
    queryKey: ['wallets'],
    queryFn: walletsService.list,
    enabled: isAuthenticated,
  })

  const addForm = useForm<WalletForm>({
    resolver: zodResolver(walletSchema),
    defaultValues: {
      network: 'ethereum',
      role: 'secondary',
    },
  })

  const editForm = useForm<WalletForm>({
    resolver: zodResolver(walletSchema),
  })

  const createMutation = useMutation({
    mutationFn: walletsService.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['wallets'] })
      addForm.reset()
      setShowAddForm(false)
      toast({
        title: 'Wallet added!',
        description: 'New wallet address registered to your account.',
      })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.response?.data?.message || 'Could not register wallet.',
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WalletForm> }) =>
      walletsService.update(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['wallets'] })
      setEditingWallet(null)
      toast({
        title: 'Wallet updated!',
        description: 'Wallet configuration has been saved.',
      })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.response?.data?.message || 'Could not update wallet.',
      })
    },
  })

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-xl">
        <Skeleton className="h-8 w-36 mb-6" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <AlertCircle className="h-12 w-12 text-primary mx-auto mb-4" aria-hidden="true" />
        <h1 className="text-2xl font-bold mb-2">Sign in required</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Please sign in to manage your connected Web3 wallets.
        </p>
        <Button asChild className="w-full">
          <Link to="/login" search={{ redirect: '/wallets' }}>Sign In</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Connected Wallets</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your primary and secondary payment addresses
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setShowAddForm(!showAddForm)
            setEditingWallet(null)
          }}
          className="flex items-center gap-1.5"
        >
          {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          <span>{showAddForm ? 'Cancel' : 'Add Wallet'}</span>
        </Button>
      </div>

      {showAddForm && (
        <section className="p-6 rounded-2xl border border-primary/40 bg-primary/5 shadow-sm space-y-4">
          <h2 className="text-base font-bold">Register New Wallet</h2>

          <form
            onSubmit={addForm.handleSubmit((data) => createMutation.mutate(data))}
            className="space-y-4"
            noValidate
          >
            <div className="space-y-1.5">
              <Label htmlFor="new-wallet-label">Wallet Label</Label>
              <Input
                id="new-wallet-label"
                placeholder="e.g. Ledger Cold Storage"
                aria-invalid={!!addForm.formState.errors.label}
                {...addForm.register('label')}
              />
              {addForm.formState.errors.label && (
                <p className="text-xs text-destructive font-medium">
                  {addForm.formState.errors.label.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-wallet-address">Wallet Address</Label>
              <Input
                id="new-wallet-address"
                placeholder="0x... or Solana Base58"
                className="font-mono text-xs"
                aria-invalid={!!addForm.formState.errors.address}
                {...addForm.register('address')}
              />
              {addForm.formState.errors.address && (
                <p className="text-xs text-destructive font-medium">
                  {addForm.formState.errors.address.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="new-wallet-network">Network</Label>
                <select
                  id="new-wallet-network"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  {...addForm.register('network')}
                >
                  <option value="ethereum">Ethereum</option>
                  <option value="polygon">Polygon</option>
                  <option value="solana">Solana</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-wallet-role">Role</Label>
                <select
                  id="new-wallet-role"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  {...addForm.register('role')}
                >
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Saving...' : 'Add Wallet'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </section>
      )}

      <section className="space-y-4" aria-label="Wallet address list">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        ) : wallets && wallets.length > 0 ? (
          wallets.map((wallet) => {
            const isEditing = editingWallet?.id === wallet.id

            if (isEditing) {
              return (
                <div
                  key={wallet.id}
                  className="p-5 rounded-2xl border border-primary bg-card space-y-4"
                >
                  <h3 className="text-sm font-bold">Edit Wallet: {wallet.label}</h3>
                  <form
                    onSubmit={editForm.handleSubmit((data) =>
                      updateMutation.mutate({ id: wallet.id, data }),
                    )}
                    className="space-y-3"
                  >
                    <div className="space-y-1">
                      <Label htmlFor={`edit-label-${wallet.id}`}>Label</Label>
                      <Input
                        id={`edit-label-${wallet.id}`}
                        defaultValue={wallet.label}
                        {...editForm.register('label')}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor={`edit-network-${wallet.id}`}>Network</Label>
                        <select
                          id={`edit-network-${wallet.id}`}
                          defaultValue={wallet.network}
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                          {...editForm.register('network')}
                        >
                          <option value="ethereum">Ethereum</option>
                          <option value="polygon">Polygon</option>
                          <option value="solana">Solana</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor={`edit-role-${wallet.id}`}>Role</Label>
                        <select
                          id={`edit-role-${wallet.id}`}
                          defaultValue={wallet.role}
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                          {...editForm.register('role')}
                        >
                          <option value="primary">Primary</option>
                          <option value="secondary">Secondary</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        type="submit"
                        size="sm"
                        disabled={updateMutation.isPending}
                      >
                        {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingWallet(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              )
            }

            return (
              <div
                key={wallet.id}
                className="p-5 rounded-2xl border border-border bg-card shadow-sm flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <Wallet className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate">{wallet.label}</p>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                          wallet.role === 'primary'
                            ? 'bg-primary/20 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {wallet.role}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5 truncate max-w-xs sm:max-w-md">
                      {wallet.address}
                    </p>
                    <p className="text-[11px] text-muted-foreground/80 capitalize mt-0.5">
                      Network: {wallet.network}
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingWallet(wallet)
                    setShowAddForm(false)
                    editForm.reset({
                      address: wallet.address,
                      label: wallet.label,
                      network: wallet.network,
                      role: wallet.role,
                    })
                  }}
                  className="flex-shrink-0"
                  aria-label={`Edit ${wallet.label}`}
                >
                  <Edit2 className="h-4 w-4 mr-1" aria-hidden="true" />
                  <span>Edit</span>
                </Button>
              </div>
            )
          })
        ) : (
          <div className="text-center py-12 border border-dashed border-border rounded-2xl">
            <Wallet className="h-10 w-10 text-muted-foreground mx-auto mb-2" aria-hidden="true" />
            <p className="font-medium text-sm">No wallets registered yet</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Add your primary wallet to easily purchase NFTs.
            </p>
            <Button size="sm" onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Add First Wallet
            </Button>
          </div>
        )}
      </section>
    </div>
  )
}
