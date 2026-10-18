import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import appCss from '../styles/app.css?url'

import { TooltipProvider } from '@/components/ui/tooltip'
import { FileQuestion } from 'lucide-react'

export interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Mari Mari Outdoor Equipment',
      },
    ],
    links: [
      {
        rel: 'icon',
        type: 'image/png',
        href: '/favicon.png',
      },
      {
        rel: 'apple-touch-icon',
        href: '/marimari-logo.png',
      },
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  notFoundComponent: RootNotFoundComponent,
  component: RootDocument,
})

function RootNotFoundComponent() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted">
        <FileQuestion className="size-7 text-muted-foreground" />
      </div>
      <h1 className="mt-4 text-xl font-bold tracking-tight">404 - Halaman Tidak Ditemukan</h1>
      <p className="mt-2 max-w-sm text-xs text-muted-foreground">
        Halaman yang Anda tuju tidak ditemukan atau alamat URL yang dimasukkan salah.
      </p>
      <Link
        to={'/' as any}
        className="mt-5 inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-xs font-medium text-primary-foreground shadow-xs transition hover:opacity-90 active:scale-[0.98]"
      >
        Kembali ke Dashboard
      </Link>
    </div>
  )
}

function RootDocument() {
  return (
    <html lang="id">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
        <TooltipProvider>
          <Outlet />
        </TooltipProvider>
        <Scripts />
      </body>
    </html>
  )
}
