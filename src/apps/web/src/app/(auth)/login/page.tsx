'use client'

import { authClient } from '@/lib/auth-client'
import { Button, Input, Label } from '@barber/ui'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const { error } = await authClient.signIn.email({
      email: form.get('email') as string,
      password: form.get('password') as string,
      callbackURL: '/dashboard',
    })

    if (error) {
      setError('E-mail ou senha inválidos.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Bem-vindo de volta</h1>
        <p className="mt-1 text-sm text-muted-foreground">Entre na sua conta</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" placeholder="voce@exemplo.com" required />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <Link href="#" className="text-xs text-muted-foreground hover:text-foreground">
              Esqueceu a senha?
            </Link>
          </div>
          <Input id="password" name="password" type="password" placeholder="••••••••" required />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Não tem uma conta?{' '}
        <Link href="/register" className="font-medium text-foreground hover:underline">
          Cadastre-se
        </Link>
      </p>
    </>
  )
}
