'use client'

import { cancelAppointmentAction } from '@/lib/appointments/actions'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@barber/ui'
import { useState, useTransition } from 'react'

export function CancelButton({ appointmentId }: { appointmentId: string }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleCancel() {
    setError('')
    startTransition(async () => {
      try {
        await cancelAppointmentAction(appointmentId)
        setOpen(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao cancelar')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
          Cancelar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar agendamento?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</p>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Manter
          </Button>
          <Button variant="destructive" onClick={handleCancel} disabled={pending}>
            {pending ? 'Cancelando...' : 'Sim, cancelar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
