'use client'

import { inviteBarberAction } from '@/lib/barbers/actions'
import { type InviteBarberInput, inviteBarberSchema } from '@barber/types'
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
import { Copy } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'

export function InviteBarberDialog({
  barbershopId,
  open,
  onOpenChange,
}: {
  barbershopId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null)

  const form = useForm<InviteBarberInput>({
    resolver: zodResolver(inviteBarberSchema),
    defaultValues: { name: '', email: '', bio: '' },
  })

  function handleClose(next: boolean) {
    if (!next) {
      setCredentials(null)
      form.reset()
    }
    onOpenChange(next)
  }

  function onSubmit(values: InviteBarberInput) {
    startTransition(async () => {
      try {
        const result = await inviteBarberAction(barbershopId, values)
        router.refresh()
        if (result.tempPassword) {
          setCredentials({ email: result.user.email, password: result.tempPassword })
          toast.success('Conta criada para o barbeiro!')
        } else {
          toast.success('Barbeiro adicionado!')
          handleClose(false)
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro ao convidar barbeiro')
      }
    })
  }

  async function copyPassword() {
    if (!credentials) return
    await navigator.clipboard.writeText(credentials.password)
    toast.success('Senha copiada')
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        {credentials ? (
          <>
            <DialogHeader>
              <DialogTitle>Conta criada</DialogTitle>
              <DialogDescription>
                Compartilhe estas credenciais com o barbeiro. A senha não será exibida novamente.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground">E-mail</p>
                <p className="text-sm font-medium">{credentials.email}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Senha temporária</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-md border bg-muted px-3 py-2 font-mono text-sm">
                    {credentials.password}
                  </code>
                  <Button type="button" variant="outline" size="icon" onClick={copyPassword}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => handleClose(false)}>
                Concluir
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Adicionar barbeiro</DialogTitle>
              <DialogDescription>
                Se o e-mail já tiver conta, ele será vinculado. Caso contrário, criaremos uma conta
                com senha temporária.
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
                        <Input placeholder="João Silva" {...field} />
                      </FormControl>
                      <FormDescription>Usado apenas se uma conta nova for criada.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="barbeiro@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio (opcional)</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={pending}>
                    {pending ? 'Adicionando…' : 'Adicionar barbeiro'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
