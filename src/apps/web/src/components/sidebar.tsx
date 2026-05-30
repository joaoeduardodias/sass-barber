'use client'

import type { Barbershop } from '@barber/types'
import { cn } from '@barber/ui'
import { CalendarDays, LayoutDashboard, Scissors, Settings, Tag, Users } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShopSwitcher } from './shop-switcher'
import { ThemeToggle } from './theme-toggle'
import { UserMenu } from './user-menu'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/appointments', label: 'Agendamentos', icon: CalendarDays },
  { href: '/barbers', label: 'Barbeiros', icon: Scissors },
  { href: '/services', label: 'Serviços', icon: Tag },
  { href: '/customers', label: 'Clientes', icon: Users },
]

export function Sidebar({
  shops,
  activeId,
  user,
}: {
  shops: Barbershop[]
  activeId: string | null
  user: { name: string; email: string }
}) {
  const pathname = usePathname()
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)

  const linkClass = (active: boolean) =>
    cn(
      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
      active
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
    )

  return (
    <aside className="flex h-screen w-[var(--sidebar-width)] shrink-0 flex-col border-r bg-card">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-primary">
            <Scissors className="h-3.5 w-3.5 text-primary-foreground" />
          </span>
          <span className="text-sm font-semibold">BarberSaaS</span>
        </Link>
      </div>

      <div className="border-b p-2">
        <ShopSwitcher shops={shops} activeId={activeId} />
      </div>

      <nav className="flex-1 overflow-y-auto p-2" aria-label="Navegação principal">
        <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Menu
        </p>
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={linkClass(active)}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="space-y-1 border-t p-2">
        <Link
          href="/settings"
          aria-current={isActive('/settings') ? 'page' : undefined}
          className={linkClass(isActive('/settings'))}
        >
          <Settings className="h-4 w-4 shrink-0" aria-hidden="true" />
          Configurações
        </Link>
        <div className="flex items-center gap-1">
          <div className="min-w-0 flex-1">
            <UserMenu name={user.name} email={user.email} />
          </div>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  )
}
