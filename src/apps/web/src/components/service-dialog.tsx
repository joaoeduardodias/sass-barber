'use client'

import { createServiceAction, updateServiceAction } from '@/lib/services/actions'
import { type CreateServiceInput, type Service, createServiceSchema } from '@barber/types'
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
  Input,
  Textarea,
  toast,
} from '@barber/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useEffect, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'

type ServiceFormValues = z.input<typeof createServiceSchema>

export function ServiceDialog({
  barbershopId,
  service,
  open,
  onOpenChange,
}: {
  barbershopId: string
  service?: Service
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const isEdit = Boolean(service)

  const form = useForm<ServiceFormValues, unknown, CreateServiceInput>({
    resolver: zodResolver(createServiceSchema),
    defaultValues: {
      name: service?.name ?? '',
      description: service?.description ?? '',
      duration: service?.duration ?? 30,
      price: service?.price ?? 0,
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name: service?.name ?? '',
        description: service?.description ?? '',
        duration: service?.duration ?? 30,
        price: service?.price ?? 0,
      })
    }
  }, [open, service, form])

  function onSubmit(values: CreateServiceInput) {
    startTransition(async () => {
      try {
        if (isEdit && service) {
          await updateServiceAction(barbershopId, service.id, values)
          toast.success('Serviço atualizado!')
        } else {
          await createServiceAction(barbershopId, values)
          toast.success('Serviço criado!')
        }
        onOpenChange(false)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro ao salvar serviço')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar serviço' : 'Novo serviço'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Atualize os dados do serviço.' : 'Adicione um serviço ao seu catálogo.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Corte masculino" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração (min)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={5}
                        step={5}
                        {...field}
                        value={field.value as number}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        {...field}
                        value={field.value as number}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? 'Salvando…' : isEdit ? 'Salvar' : 'Criar serviço'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
