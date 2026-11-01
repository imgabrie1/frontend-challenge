import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import type { QueryClient } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/toaster'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { DevToolbar } from '@/components/DevToolbar'
import { SessionProvider } from '@/hooks/useSession'
import { useSocket } from '@/hooks/useSocket'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
})

function RootContent() {
  useSocket()

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <Toaster />
      <DevToolbar />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </div>
  )
}

function RootLayout() {
  return (
    <SessionProvider>
      <RootContent />
    </SessionProvider>
  )
}
