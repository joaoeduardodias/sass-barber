'use client'

import { Topbar } from '@/components/topbar'
import { Bell, Building2, Lock, Save, User } from 'lucide-react'
import { useState } from 'react'

const tabs = [
  { id: 'barbershop', label: 'Barbearia', icon: Building2 },
  { id: 'account', label: 'Conta', icon: User },
  { id: 'notifications', label: 'Notificações', icon: Bell },
] as const

type Tab = (typeof tabs)[number]['id']

const notificationItems = [
  {
    id: 'new_appointment',
    label: 'Novo agendamento',
    desc: 'Receba notificações quando um cliente agendar',
    defaultChecked: true,
  },
  {
    id: 'cancellation',
    label: 'Cancelamento',
    desc: 'Notificar quando um agendamento for cancelado',
    defaultChecked: true,
  },
  {
    id: 'reminder',
    label: 'Lembrete de agendamento',
    desc: 'Enviar lembrete 1 hora antes do horário',
    defaultChecked: false,
  },
  {
    id: 'daily_summary',
    label: 'Resumo diário',
    desc: 'Receba um resumo dos agendamentos do dia',
    defaultChecked: false,
  },
  {
    id: 'new_customer',
    label: 'Novo cliente',
    desc: 'Notificar quando um novo cliente se cadastrar',
    defaultChecked: false,
  },
]

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('barbershop')
  const [saved, setSaved] = useState(false)

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <>
      <Topbar title="Configurações" description="Gerencie as configurações da sua barbearia" />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl space-y-6">
          <div className="flex items-center gap-1 border-b" role="tablist">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  tab === id
                    ? 'border-zinc-900 text-zinc-900'
                    : 'border-transparent text-zinc-500 hover:text-zinc-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>

          {tab === 'barbershop' && (
            <form onSubmit={handleSave} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="shop-name" className="text-xs font-medium text-zinc-700">
                  Nome da barbearia
                </label>
                <input
                  id="shop-name"
                  type="text"
                  defaultValue="BarberSaaS"
                  className="w-full h-10 px-3 rounded-md border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="shop-desc" className="text-xs font-medium text-zinc-700">
                  Descrição
                </label>
                <textarea
                  id="shop-desc"
                  defaultValue="Barbearia moderna no coração da cidade."
                  rows={3}
                  className="w-full px-3 py-2 rounded-md border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="shop-address" className="text-xs font-medium text-zinc-700">
                  Endereço
                </label>
                <input
                  id="shop-address"
                  type="text"
                  defaultValue="Rua das Flores, 123 — São Paulo, SP"
                  className="w-full h-10 px-3 rounded-md border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="shop-phone" className="text-xs font-medium text-zinc-700">
                  Telefone
                </label>
                <input
                  id="shop-phone"
                  type="tel"
                  defaultValue="(11) 3333-4444"
                  className="w-full h-10 px-3 rounded-md border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="shop-slug" className="text-xs font-medium text-zinc-700">
                  Slug (URL pública)
                </label>
                <div className="flex items-center rounded-md border border-zinc-200 overflow-hidden focus-within:ring-2 focus-within:ring-zinc-900 focus-within:border-transparent transition">
                  <span className="px-3 h-10 flex items-center text-sm text-zinc-400 bg-zinc-50 border-r shrink-0 select-none">
                    barbersaas.com/
                  </span>
                  <input
                    id="shop-slug"
                    type="text"
                    defaultValue="minha-barbearia"
                    className="flex-1 h-10 px-3 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-md transition-colors ${
                    saved ? 'bg-emerald-600 text-white' : 'bg-zinc-900 text-white hover:bg-zinc-700'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" aria-hidden="true" />
                  {saved ? 'Salvo!' : 'Salvar alterações'}
                </button>
              </div>
            </form>
          )}

          {tab === 'account' && (
            <form onSubmit={handleSave} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="account-name" className="text-xs font-medium text-zinc-700">
                  Nome
                </label>
                <input
                  id="account-name"
                  type="text"
                  defaultValue="João Dias"
                  className="w-full h-10 px-3 rounded-md border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="account-email" className="text-xs font-medium text-zinc-700">
                  E-mail
                </label>
                <input
                  id="account-email"
                  type="email"
                  defaultValue="joaoeduardodias123@gmail.com"
                  className="w-full h-10 px-3 rounded-md border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
                />
              </div>

              <div className="border-t pt-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
                  <p className="text-xs font-semibold text-zinc-700">Alterar senha</p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="current-password" className="text-xs font-medium text-zinc-700">
                    Senha atual
                  </label>
                  <input
                    id="current-password"
                    type="password"
                    placeholder="••••••••"
                    className="w-full h-10 px-3 rounded-md border border-zinc-200 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="new-password" className="text-xs font-medium text-zinc-700">
                    Nova senha
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    className="w-full h-10 px-3 rounded-md border border-zinc-200 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirm-password" className="text-xs font-medium text-zinc-700">
                    Confirmar nova senha
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    className="w-full h-10 px-3 rounded-md border border-zinc-200 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-md transition-colors ${
                    saved ? 'bg-emerald-600 text-white' : 'bg-zinc-900 text-white hover:bg-zinc-700'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" aria-hidden="true" />
                  {saved ? 'Salvo!' : 'Salvar alterações'}
                </button>
              </div>
            </form>
          )}

          {tab === 'notifications' && (
            <form onSubmit={handleSave} className="space-y-3">
              {notificationItems.map(({ id, label, desc, defaultChecked }) => (
                <label
                  key={id}
                  htmlFor={id}
                  className="flex items-start justify-between gap-4 p-4 rounded-xl border bg-white cursor-pointer hover:bg-zinc-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{label}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{desc}</p>
                  </div>
                  <input
                    id={id}
                    type="checkbox"
                    defaultChecked={defaultChecked}
                    className="mt-0.5 w-4 h-4 rounded accent-zinc-900 shrink-0"
                  />
                </label>
              ))}

              <div className="flex items-center justify-end pt-2">
                <button
                  type="submit"
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-md transition-colors ${
                    saved ? 'bg-emerald-600 text-white' : 'bg-zinc-900 text-white hover:bg-zinc-700'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" aria-hidden="true" />
                  {saved ? 'Salvo!' : 'Salvar preferências'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </>
  )
}
