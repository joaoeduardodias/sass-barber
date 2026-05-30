import { getServerSession } from '@/lib/session'
import { Scissors } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'

export default async function CustomerLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession()
  if (!session) redirect('/login?callbackUrl=/minha-conta')

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex h-14 items-center border-b bg-background/80 px-6 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-amber-600">
            <Scissors className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold">BarberSaaS</span>
        </Link>
        <div className="ml-auto flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{session.user.name}</span>
          <form
            action={async () => {
              'use server'
              const { cookies } = await import('next/headers')
              const jar = await cookies()
              jar.delete('better-auth.session_token')
              jar.delete('__Secure-better-auth.session_token')
              redirect('/login')
            }}
          >
            <button type="submit" className="text-sm text-muted-foreground hover:text-foreground">
              Sair
            </button>
          </form>
        </div>
      </header>
      {children}
    </div>
  )
}
