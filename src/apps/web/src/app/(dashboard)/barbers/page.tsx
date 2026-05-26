'use client'

import { Topbar } from '@/components/topbar'
import { MoreHorizontal, Plus, Search, Star, X } from 'lucide-react'
import { useState } from 'react'

interface Barber {
  id: string
  name: string
  email: string
  phone: string
  bio: string
  isActive: boolean
  appointmentsToday: number
  totalAppointments: number
  rating: number
}

const initialBarbers: Barber[] = [
  {
    id: '1',
    name: 'Diego Santos',
    email: 'diego@barbersaas.com',
    phone: '(11) 99999-1111',
    bio: 'Especialista em degradê e barba',
    isActive: true,
    appointmentsToday: 5,
    totalAppointments: 342,
    rating: 4.9,
  },
  {
    id: '2',
    name: 'André Oliveira',
    email: 'andre@barbersaas.com',
    phone: '(11) 99999-2222',
    bio: 'Cortes clássicos e modernos',
    isActive: true,
    appointmentsToday: 3,
    totalAppointments: 218,
    rating: 4.8,
  },
  {
    id: '3',
    name: 'Pedro Costa',
    email: 'pedro@barbersaas.com',
    phone: '(11) 99999-3333',
    bio: 'Especialista em barba e tratamentos capilares',
    isActive: true,
    appointmentsToday: 4,
    totalAppointments: 187,
    rating: 4.7,
  },
  {
    id: '4',
    name: 'Carlos Lima',
    email: 'carlos@barbersaas.com',
    phone: '(11) 99999-4444',
    bio: 'Cortes infantis e adultos',
    isActive: false,
    appointmentsToday: 0,
    totalAppointments: 95,
    rating: 4.6,
  },
]

function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const inputCls =
  'w-full h-9 px-3 rounded-md border border-zinc-200 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition'
const labelCls = 'text-xs font-medium text-zinc-700'

export default function BarbersPage() {
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [selected, setSelected] = useState<Barber | null>(null)
  const [barbers, setBarbers] = useState(initialBarbers)

  const filtered = barbers.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.email.toLowerCase().includes(search.toLowerCase()),
  )

  function openEdit(barber: Barber) {
    setSelected(barber)
    setModal('edit')
  }

  function closeModal() {
    setModal(null)
    setSelected(null)
  }

  function toggleActive(id: string) {
    setBarbers((prev) => prev.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b)))
  }

  return (
    <>
      <Topbar
        title="Barbeiros"
        description="Gerencie a equipe da barbearia"
        actions={
          <button
            type="button"
            onClick={() => setModal('create')}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-zinc-900 text-white rounded-md hover:bg-zinc-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Adicionar barbeiro
          </button>
        }
      />

      <main className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="relative max-w-xs">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400"
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder="Buscar barbeiro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-md border border-zinc-200 bg-white text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <p className="text-sm text-zinc-400 col-span-full py-8 text-center">
              Nenhum barbeiro encontrado
            </p>
          ) : (
            filtered.map((barber) => (
              <article
                key={barber.id}
                className="bg-white rounded-xl border p-5 flex flex-col gap-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                      {initials(barber.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-900 truncate">{barber.name}</p>
                      <p className="text-xs text-zinc-400 truncate">{barber.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        barber.isActive
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-zinc-100 text-zinc-500'
                      }`}
                    >
                      {barber.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                    <button
                      type="button"
                      aria-label={`Editar ${barber.name}`}
                      onClick={() => openEdit(barber)}
                      className="p-1 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {barber.bio && (
                  <p className="text-xs text-zinc-500 leading-relaxed">{barber.bio}</p>
                )}

                <div className="grid grid-cols-3 gap-3 pt-1 border-t">
                  <div className="text-center">
                    <p className="text-sm font-bold text-zinc-900">{barber.appointmentsToday}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Hoje</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-zinc-900">{barber.totalAppointments}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-zinc-900 flex items-center justify-center gap-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" aria-hidden="true" />
                      {barber.rating}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">Nota</p>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </main>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 h-full w-full bg-black/40 backdrop-blur-sm border-0 cursor-default"
            onClick={closeModal}
            aria-label="Fechar modal"
            tabIndex={-1}
          />
          <dialog
            open
            className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 m-0 border-0"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-zinc-900">
                {modal === 'create' ? 'Adicionar barbeiro' : 'Editar barbeiro'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Fechar"
                className="p-1 rounded hover:bg-zinc-100 text-zinc-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                closeModal()
              }}
            >
              <div className="space-y-1.5">
                <label htmlFor="barber-name" className={labelCls}>
                  Nome completo
                </label>
                <input
                  id="barber-name"
                  type="text"
                  defaultValue={selected?.name}
                  placeholder="Nome do barbeiro"
                  className={inputCls}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="barber-email" className={labelCls}>
                  E-mail
                </label>
                <input
                  id="barber-email"
                  type="email"
                  defaultValue={selected?.email}
                  placeholder="email@exemplo.com"
                  className={inputCls}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="barber-phone" className={labelCls}>
                  Telefone
                </label>
                <input
                  id="barber-phone"
                  type="tel"
                  defaultValue={selected?.phone}
                  placeholder="(11) 99999-0000"
                  className={inputCls}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="barber-bio" className={labelCls}>
                  Bio
                </label>
                <textarea
                  id="barber-bio"
                  defaultValue={selected?.bio}
                  placeholder="Especialidades e descrição..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-md border border-zinc-200 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition resize-none"
                />
              </div>

              {modal === 'edit' && selected && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 border">
                  <div>
                    <p className="text-xs font-medium text-zinc-700">Status</p>
                    <p className="text-xs text-zinc-400">
                      {selected.isActive ? 'Barbeiro ativo' : 'Barbeiro inativo'}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Alternar status"
                    onClick={() => {
                      toggleActive(selected.id)
                      setSelected((prev) => (prev ? { ...prev, isActive: !prev.isActive } : prev))
                    }}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      selected.isActive ? 'bg-zinc-900' : 'bg-zinc-200'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        selected.isActive ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 border rounded-md hover:bg-zinc-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-medium bg-zinc-900 text-white rounded-md hover:bg-zinc-700 transition-colors"
                >
                  {modal === 'create' ? 'Adicionar' : 'Salvar alterações'}
                </button>
              </div>
            </form>
          </dialog>
        </div>
      )}
    </>
  )
}
