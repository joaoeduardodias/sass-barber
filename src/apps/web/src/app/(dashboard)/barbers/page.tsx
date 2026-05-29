import { BarbersManager } from '@/components/barbers-manager'
import { Topbar } from '@/components/topbar'
import { listBarbers } from '@/lib/barbers/queries'
import { listBarbershops } from '@/lib/barbershops/queries'
import { getActiveBarbershopId } from '@/lib/tenant.server'
import { Building2 } from 'lucide-react'

export const metadata = { title: 'Barbeiros' }

export default async function BarbersPage() {
  const shops = await listBarbershops()
  const activeId = (await getActiveBarbershopId()) ?? shops[0]?.id ?? null

  if (!activeId) {
    return (
      <>
        <Topbar title="Barbeiros" description="Gerencie a sua equipe" />
        <main className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <Building2 className="h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-sm font-medium">Você ainda não tem uma barbearia</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Crie uma pelo seletor na barra lateral.
          </p>
        </main>
      </>
    )
  }

  const barbers = await listBarbers(activeId)

  return (
    <>
      <Topbar title="Barbeiros" description="Gerencie a sua equipe" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl">
          <BarbersManager barbershopId={activeId} barbers={barbers} />
        </div>
      </main>
    </>
  )
}
