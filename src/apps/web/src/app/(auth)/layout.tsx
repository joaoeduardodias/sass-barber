import { Scissors } from 'lucide-react'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col bg-zinc-900 p-10 text-white">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
            <Scissors className="w-3.5 h-3.5 text-zinc-900" />
          </div>
          <span className="font-semibold text-sm">BarberSaaS</span>
        </Link>

        <div className="flex-1 flex items-end pb-4">
          <blockquote className="space-y-3">
            <p className="text-xl font-medium leading-snug text-zinc-100">
              &ldquo;Reduzi o tempo de gestão em 70% e aumentei o faturamento da minha
              barbearia.&rdquo;
            </p>
            <footer>
              <p className="text-sm font-semibold text-white">Carlos Mendes</p>
              <p className="text-xs text-zinc-500">Dono · Barbearia Clássica, São Paulo</p>
            </footer>
          </blockquote>
        </div>

        <p className="text-xs text-zinc-600">© 2026 BarberSaaS</p>
      </div>

      <div className="flex flex-col items-center justify-center p-6 lg:p-10 bg-zinc-50">
        <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="w-6 h-6 bg-zinc-900 rounded flex items-center justify-center">
            <Scissors className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-zinc-900 text-sm">BarberSaaS</span>
        </Link>

        <div className="w-full max-w-sm bg-white rounded-xl border shadow-sm p-7">{children}</div>
      </div>
    </div>
  )
}
