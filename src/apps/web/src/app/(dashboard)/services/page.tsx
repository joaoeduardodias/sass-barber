import { ServicesManager } from '@/components/services-manager'
import { Topbar } from '@/components/topbar'
import { listBarbershops } from '@/lib/barbershops/queries'
import { listServices } from '@/lib/services/queries'
import { getActiveBarbershopId } from '@/lib/tenant.server'
import { Building2 } from 'lucide-react'

export const metadata = { title: 'Serviços' }

export default async function ServicesPage() {
  const shops = await listBarbershops()
  const activeId = (await getActiveBarbershopId()) ?? shops[0]?.id ?? null

  if (!activeId) {
    return (
      <>
        <Topbar title="Serviços" description="Gerencie os serviços oferecidos" />
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

  const services = await listServices(activeId)

  return (
    <>
      <Topbar title="Serviços" description="Gerencie os serviços oferecidos" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl">
          <ServicesManager barbershopId={activeId} services={services} />
        </div>
      </main>
    </>
  )
}
