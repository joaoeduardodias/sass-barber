import { Sidebar } from '@/components/sidebar'
import { listBarbershops } from '@/lib/barbershops/queries'
import { getServerSession } from '@/lib/session'
import { getActiveBarbershopId } from '@/lib/tenant.server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()
  if (!session) redirect('/login')

  const shops = await listBarbershops()
  const cookieActive = await getActiveBarbershopId()
  const activeId = cookieActive ?? shops[0]?.id ?? null

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar shops={shops} activeId={activeId} user={session.user} />
      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  )
}
