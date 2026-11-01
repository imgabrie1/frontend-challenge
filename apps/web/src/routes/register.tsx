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
import { UserPlus, User, Mail, AtSign, Lock } from 'lucide-react'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores are allowed'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
})

type RegisterForm = z.infer<typeof registerSchema>

const searchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/register')({
  validateSearch: (search: Record<string, unknown>) => searchSchema.parse(search),
  component: RegisterPage,
})

function RegisterPage() {
  const { redirect } = Route.useSearch()
  const { login } = useSession()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const mutation = useMutation({
    mutationFn: authService.register,
    onSuccess: (data) => {
      login(data.user, data.tokens.accessToken)
      toast({
        title: 'Account created!',
        description: `Welcome to NFT Market, ${data.user.name}!`,
      })
      void navigate({ to: redirect ?? '/' })
    },
    onError: (error: any) => {
      const details = error?.response?.data?.details
      if (details) {
        Object.entries(details).forEach(([field, messages]) => {
          setError(field as keyof RegisterForm, {
            message: Array.isArray(messages) ? messages[0] : String(messages),
          })
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Registration failed',
          description: error?.response?.data?.message || 'Could not create account. Please try again.',
        })
      }
    },
  })

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <UserPlus className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Create Account</h1>
          <p className="text-sm text-muted-foreground">
            Join the decentralized community of digital collectors
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card shadow-sm">
          <form
            onSubmit={handleSubmit((data) => mutation.mutate(data))}
            className="space-y-4"
            noValidate
            aria-label="Registration form"
          >
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g. Carol Danvers"
                  autoComplete="name"
                  className="pl-9"
                  aria-describedby={errors.name ? 'name-error' : undefined}
                  aria-invalid={!!errors.name}
                  {...register('name')}
                />
              </div>
              {errors.name && (
                <p id="name-error" role="alert" className="text-xs text-destructive mt-1 font-medium">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="email"
                  type="email"
                  placeholder="carol@example.com"
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
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="username"
                  type="text"
                  placeholder="carol_collector"
                  autoComplete="username"
                  className="pl-9"
                  aria-describedby={errors.username ? 'username-error' : undefined}
                  aria-invalid={!!errors.username}
                  {...register('username')}
                />
              </div>
              {errors.username && (
                <p id="username-error" role="alert" className="text-xs text-destructive mt-1 font-medium">
                  {errors.username.message}
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
                  placeholder="At least 8 chars, 1 uppercase & 1 number"
                  autoComplete="new-password"
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
              className="w-full text-base font-semibold mt-2"
              disabled={mutation.isPending}
              aria-busy={mutation.isPending}
            >
              {mutation.isPending ? 'Creating Account...' : 'Complete Registration'}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link
              to="/login"
              search={redirect ? { redirect } : undefined}
              className="text-primary font-semibold hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
