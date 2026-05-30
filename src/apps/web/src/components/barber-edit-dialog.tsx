'use client'

import { updateBarberAction } from '@/lib/barbers/actions'
import { type Barber, type UpdateBarberInput, updateBarberSchema } from '@barber/types'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Textarea,
  toast,
} from '@barber/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useEffect, useTransition } from 'react'
import { useForm } from 'react-hook-form'

export function BarberEditDialog({
  barbershopId,
  barber,
  open,
  onOpenChange,
}: {
  barbershopId: string
  barber: Barber | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const form = useForm<UpdateBarberInput>({
    resolver: zodResolver(updateBarberSchema),
    defaultValues: { bio: barber?.bio ?? '' },
  })

  useEffect(() => {
    if (open) form.reset({ bio: barber?.bio ?? '' })
  }, [open, barber, form])

  function onSubmit(values: UpdateBarberInput) {
    if (!barber) return
    startTransition(async () => {
      try {
        await updateBarberAction(barbershopId, barber.id, values)
        toast.success('Barbeiro atualizado!')
        onOpenChange(false)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar barbeiro</DialogTitle>
          <DialogDescription>{barber?.user.name}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? 'Salvando…' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
