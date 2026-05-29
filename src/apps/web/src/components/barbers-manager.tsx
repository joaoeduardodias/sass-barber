'use client'

import { BarberEditDialog } from '@/components/barber-edit-dialog'
import { InviteBarberDialog } from '@/components/invite-barber-dialog'
import { deleteBarberAction, updateBarberAction } from '@/lib/barbers/actions'
import type { Barber } from '@barber/types'
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
import { MoreVertical, Pencil, Plus, Power, Trash2, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

export function BarbersManager({
  barbershopId,
  barbers,
}: {
  barbershopId: string
  barbers: Barber[]
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<Barber | undefined>(undefined)

  function openEdit(barber: Barber) {
    setEditing(barber)
    setEditOpen(true)
  }

  function toggleActive(barber: Barber) {
    startTransition(async () => {
      try {
        await updateBarberAction(barbershopId, barber.id, { isActive: !barber.isActive })
        toast.success(barber.isActive ? 'Barbeiro desativado' : 'Barbeiro ativado')
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro ao atualizar')
      }
    })
  }

  function remove(barber: Barber) {
    if (!confirm(`Remover ${barber.user.name} da equipe?`)) return
    startTransition(async () => {
      try {
        await deleteBarberAction(barbershopId, barber.id)
        toast.success('Barbeiro removido')
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro ao remover')
      }
    })
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setInviteOpen(true)}>
          <Plus className="h-4 w-4" />
          Adicionar barbeiro
        </Button>
      </div>

      {barbers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <Users className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">Nenhum barbeiro na equipe</p>
            <p className="text-xs text-muted-foreground">
              Clique em “Adicionar barbeiro” para montar sua equipe.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {barbers.map((barber) => (
            <Card key={barber.id} className={barber.isActive ? '' : 'opacity-60'}>
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {initials(barber.user.name)}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{barber.user.name}</p>
                      {!barber.isActive && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                          Inativo
                        </span>
                      )}
                    </div>
                    <p className="truncate text-sm text-muted-foreground">{barber.user.email}</p>
                    {barber.bio && (
                      <p className="truncate text-sm text-muted-foreground">{barber.bio}</p>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Ações do barbeiro">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => openEdit(barber)}>
                      <Pencil className="h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => toggleActive(barber)}>
                      <Power className="h-4 w-4" />
                      {barber.isActive ? 'Desativar' : 'Ativar'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => remove(barber)}
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

      <InviteBarberDialog
        barbershopId={barbershopId}
        open={inviteOpen}
        onOpenChange={setInviteOpen}
      />
      <BarberEditDialog
        barbershopId={barbershopId}
        barber={editing}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  )
}
