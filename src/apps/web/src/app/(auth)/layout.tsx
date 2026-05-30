import { Scissors } from 'lucide-react'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col bg-primary p-10 text-primary-foreground lg:flex">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-primary-foreground">
            <Scissors className="h-3.5 w-3.5 text-primary" />
          </span>
          <span className="text-sm font-semibold">BarberSaaS</span>
        </Link>

        <div className="flex flex-1 items-end pb-4">
          <blockquote className="space-y-3">
            <p className="text-xl font-medium leading-snug">
              &ldquo;Reduzi o tempo de gestão em 70% e aumentei o faturamento da minha
              barbearia.&rdquo;
            </p>
            <footer>
              <p className="text-sm font-semibold">Carlos Mendes</p>
              <p className="text-xs opacity-80">Dono · Barbearia Clássica, São Paulo</p>
            </footer>
          </blockquote>
        </div>

        <p className="text-xs opacity-70">© 2026 BarberSaaS</p>
      </div>

      <div className="flex flex-col items-center justify-center bg-background p-6 lg:p-10">
        <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-primary">
            <Scissors className="h-3.5 w-3.5 text-primary-foreground" />
          </span>
          <span className="text-sm font-semibold">BarberSaaS</span>
        </Link>

        <div className="w-full max-w-sm rounded-xl border bg-card p-7 shadow-sm">{children}</div>
      </div>
    </div>
  )
}
