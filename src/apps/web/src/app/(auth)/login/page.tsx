import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Entrar' }

export default function LoginPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Bem-vindo de volta</h1>
        <p className="text-sm text-zinc-500 mt-1">Entre na sua conta</p>
      </div>

      <form className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-zinc-700">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            placeholder="voce@exemplo.com"
            className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-zinc-700">
              Senha
            </label>
            <Link href="#" className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors">
              Esqueceu a senha?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
          />
        </div>

        <button
          type="submit"
          className="w-full h-10 bg-zinc-900 text-white text-sm font-medium rounded-md hover:bg-zinc-700 transition-colors"
        >
          Entrar
        </button>
      </form>

      <p className="text-sm text-zinc-500 text-center mt-6">
        Não tem uma conta?{' '}
        <Link href="/register" className="text-zinc-900 font-medium hover:underline">
          Cadastre-se
        </Link>
      </p>
    </>
  )
}
