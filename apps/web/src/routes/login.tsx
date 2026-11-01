import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { authService } from '@/services/auth'
import { useSession } from '@/hooks/useSession'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toaster'
import { ShieldCheck, Lock, Mail } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

const searchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>) => searchSchema.parse(search),
  component: LoginPage,
})

function LoginPage() {
  const { redirect } = Route.useSearch()
  const { login } = useSession()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const mutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      login(data.user, data.tokens.accessToken)
      toast({
        title: 'Welcome back!',
        description: `Signed in as ${data.user.name}`,
      })
      void navigate({ to: redirect ?? '/' })
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: 'Invalid email or password. Check demo credentials below.',
      })
    },
  })

  const fillCredentials = (email: string, pass: string) => {
    setValue('email', email, { shouldValidate: true })
    setValue('password', pass, { shouldValidate: true })
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Lock className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Sign In</h1>
          <p className="text-sm text-muted-foreground">
            Access your collector profile, wallets, and orders
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card shadow-sm">
          <form
            onSubmit={handleSubmit((data) => mutation.mutate(data))}
            className="space-y-4"
            noValidate
            aria-label="Login form"
          >
            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="email"
                  type="email"
                  placeholder="alice@nftmarket.dev"
                  autoComplete="email"
                  className="pl-9"
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  aria-invalid={!!errors.email}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p id="email-error" role="alert" className="text-xs text-destructive mt-1 font-medium">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className="pl-9"
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  aria-invalid={!!errors.password}
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p id="password-error" role="alert" className="text-xs text-destructive mt-1 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full text-base font-semibold"
              disabled={mutation.isPending}
              aria-busy={mutation.isPending}
            >
              {mutation.isPending ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Don't have an account yet?{' '}
            <Link
              to="/register"
              search={redirect ? { redirect } : undefined}
              className="text-primary font-semibold hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>

        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
            <span>Demo Credentials (Click to prefill):</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => fillCredentials('alice@nftmarket.dev', 'Alice@123')}
              className="text-left p-2 rounded-lg bg-background/80 hover:bg-background border border-border/80 transition-colors cursor-pointer flex justify-between"
            >
              <span className="font-mono text-primary">alice@nftmarket.dev</span>
              <span className="text-muted-foreground">Alice@123</span>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('bob@nftmarket.dev', 'Bob@123')}
              className="text-left p-2 rounded-lg bg-background/80 hover:bg-background border border-border/80 transition-colors cursor-pointer flex justify-between"
            >
              <span className="font-mono text-primary">bob@nftmarket.dev</span>
              <span className="text-muted-foreground">Bob@123</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
