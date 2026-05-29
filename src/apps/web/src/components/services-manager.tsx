'use client'

import { ServiceDialog } from '@/components/service-dialog'
import { deleteServiceAction, updateServiceAction } from '@/lib/services/actions'
import type { Service } from '@barber/types'
import {
  Button,
  Card,
  CardContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  toast,
} from '@barber/ui'
import { Clock, MoreVertical, Pencil, Plus, Power, Tag, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function ServicesManager({
  barbershopId,
  services,
}: {
  barbershopId: string
  services: Service[]
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Service | undefined>(undefined)

  function openCreate() {
    setEditing(undefined)
    setDialogOpen(true)
  }

  function openEdit(service: Service) {
    setEditing(service)
    setDialogOpen(true)
  }

  function toggleActive(service: Service) {
    startTransition(async () => {
      try {
        await updateServiceAction(barbershopId, service.id, { isActive: !service.isActive })
        toast.success(service.isActive ? 'Serviço desativado' : 'Serviço ativado')
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro ao atualizar')
      }
    })
  }

  function remove(service: Service) {
    if (!confirm(`Remover o serviço "${service.name}"?`)) return
    startTransition(async () => {
      try {
        await deleteServiceAction(barbershopId, service.id)
        toast.success('Serviço removido')
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro ao remover')
      }
    })
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Novo serviço
        </Button>
      </div>

      {services.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <Tag className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">Nenhum serviço cadastrado</p>
            <p className="text-xs text-muted-foreground">
              Clique em “Novo serviço” para adicionar o primeiro.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {services.map((service) => (
            <Card key={service.id} className={service.isActive ? '' : 'opacity-60'}>
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{service.name}</p>
                    {!service.isActive && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                        Inativo
                      </span>
                    )}
                  </div>
                  {service.description && (
                    <p className="truncate text-sm text-muted-foreground">{service.description}</p>
                  )}
                  <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {service.duration} min
                    </span>
                    <span className="font-medium text-foreground">{brl.format(service.price)}</span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Ações do serviço">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => openEdit(service)}>
                      <Pencil className="h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => toggleActive(service)}>
                      <Power className="h-4 w-4" />
                      {service.isActive ? 'Desativar' : 'Ativar'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => remove(service)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remover
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ServiceDialog
        barbershopId={barbershopId}
        service={editing}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  )
}
