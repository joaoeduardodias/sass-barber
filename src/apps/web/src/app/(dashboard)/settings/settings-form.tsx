'use client'

import { updateBarbershopAction } from '@/lib/barbershops/actions'
import { type Barbershop, type UpdateBarbershopInput, updateBarbershopSchema } from '@barber/types'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Textarea,
  toast,
} from '@barber/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTransition } from 'react'
import { useForm } from 'react-hook-form'

export function SettingsForm({ shop }: { shop: Barbershop }) {
  const [pending, startTransition] = useTransition()
  const form = useForm<UpdateBarbershopInput>({
    resolver: zodResolver(updateBarbershopSchema),
    defaultValues: {
      name: shop.name,
      slug: shop.slug,
      description: shop.description ?? '',
      address: shop.address,
      phone: shop.phone,
    },
  })

  function onSubmit(values: UpdateBarbershopInput) {
    startTransition(async () => {
      try {
        await updateBarbershopAction(shop.id, values)
        toast.success('Alterações salvas!')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil da barbearia</CardTitle>
        <CardDescription>Estas informações aparecem na sua página pública.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug (URL pública)</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormDescription>Apenas letras minúsculas, números e hífens.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={pending}>
                {pending ? 'Salvando…' : 'Salvar alterações'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
