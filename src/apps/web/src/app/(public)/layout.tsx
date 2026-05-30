import { Scissors } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex h-14 items-center border-b bg-background/80 px-6 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-amber-600">
            <Scissors className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold">BarberSaaS</span>
        </Link>
        <nav className="ml-auto flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-amber-700"
          >
            Cadastrar
          </Link>
        </nav>
      </header>
      {children}
    </div>
  )
}
