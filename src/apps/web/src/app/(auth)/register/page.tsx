'use client'

import { authClient } from '@/lib/auth-client'
import { Button, Input, Label } from '@barber/ui'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const { error } = await authClient.signUp.email({
      name: form.get('name') as string,
      email: form.get('email') as string,
      password: form.get('password') as string,
      callbackURL: '/dashboard',
    })

    if (error) {
      setError(error.message ?? 'Erro ao criar conta. Tente novamente.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Criar conta</h1>
        <p className="mt-1 text-sm text-muted-foreground">Comece a gerenciar sua barbearia hoje</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome completo</Label>
          <Input id="name" name="name" type="text" placeholder="João Silva" required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" placeholder="voce@exemplo.com" required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            minLength={8}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Criando conta…' : 'Criar conta'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Já tem uma conta?{' '}
        <Link href="/login" className="font-medium text-foreground hover:underline">
          Entrar
        </Link>
      </p>
    </>
  )
}
