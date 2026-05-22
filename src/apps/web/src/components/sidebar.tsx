'use client'

import { authClient } from '@/lib/auth-client'
import { CalendarDays, LayoutDashboard, LogOut, Scissors, Settings, Tag, Users } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/appointments', label: 'Agendamentos', icon: CalendarDays },
  { href: '/barbers', label: 'Barbeiros', icon: Scissors },
  { href: '/services', label: 'Serviços', icon: Tag },
  { href: '/customers', label: 'Clientes', icon: Users },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = authClient.useSession()

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)

  async function handleSignOut() {
    await authClient.signOut()
    router.push('/login')
  }

  const userName = session?.user?.name ?? 'Minha Conta'
  const userInitial = userName.charAt(0).toUpperCase()

  return (
    <aside className="w-[var(--sidebar-width)] shrink-0 flex flex-col h-screen bg-white border-r">
      <div className="h-14 flex items-center px-4 border-b shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-6 h-6 bg-zinc-900 rounded flex items-center justify-center">
            <Scissors className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-zinc-900 text-sm">BarberSaaS</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-2" aria-label="Navegação principal">
        <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
          Menu
        </p>
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-2 border-t shrink-0">
        <Link
          href="/settings"
          aria-current={isActive('/settings') ? 'page' : undefined}
          className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
            isActive('/settings')
              ? 'bg-zinc-900 text-white'
              : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
          }`}
        >
          <Settings className="w-4 h-4 shrink-0" aria-hidden="true" />
          Configurações
        </Link>

        <div className="mt-1 flex items-center gap-3 px-3 py-2 rounded-md group">
          <div
            className="w-7 h-7 rounded-full bg-zinc-900 shrink-0 flex items-center justify-center text-white text-xs font-semibold"
            aria-hidden="true"
          >
            {userInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-zinc-900 truncate">{userName}</p>
            <p className="text-xs text-zinc-400 truncate">{session?.user?.email ?? ''}</p>
          </div>
          <button
            type="button"
            aria-label="Sair"
            onClick={handleSignOut}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
