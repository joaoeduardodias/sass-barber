import { Topbar } from '@/components/topbar'
import { getBarbershop, listBarbershops } from '@/lib/barbershops/queries'
import { getActiveBarbershopId } from '@/lib/tenant.server'
import { Building2 } from 'lucide-react'
import { SettingsForm } from './settings-form'

export const metadata = { title: 'Configurações' }

export default async function SettingsPage() {
  const shops = await listBarbershops()
  const activeId = (await getActiveBarbershopId()) ?? shops[0]?.id ?? null

  if (!activeId) {
    return (
      <>
        <Topbar title="Configurações" description="Gerencie a sua barbearia" />
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

  const shop = await getBarbershop(activeId)

  return (
    <>
      <Topbar title="Configurações" description="Gerencie o perfil da sua barbearia" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl">
          <SettingsForm shop={shop} />
        </div>
      </main>
    </>
  )
}
