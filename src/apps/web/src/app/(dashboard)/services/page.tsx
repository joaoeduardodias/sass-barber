'use client'

import { Topbar } from '@/components/topbar'
import { Clock, MoreHorizontal, Plus, Search, X } from 'lucide-react'
import { useState } from 'react'

interface Service {
  id: string
  name: string
  description: string
  duration: number
  price: number
  isActive: boolean
  appointmentsThisMonth: number
}

const initialServices: Service[] = [
  {
    id: '1',
    name: 'Corte',
    description: 'Corte masculino clássico ou moderno',
    duration: 30,
    price: 35,
    isActive: true,
    appointmentsThisMonth: 48,
  },
  {
    id: '2',
    name: 'Barba',
    description: 'Aparar e modelar a barba',
    duration: 30,
    price: 30,
    isActive: true,
    appointmentsThisMonth: 32,
  },
  {
    id: '3',
    name: 'Corte + Barba',
    description: 'Combo corte e barba completo',
    duration: 60,
    price: 65,
    isActive: true,
    appointmentsThisMonth: 56,
  },
  {
    id: '4',
    name: 'Hidratação',
    description: 'Tratamento capilar com produtos especiais',
    duration: 45,
    price: 50,
    isActive: true,
    appointmentsThisMonth: 12,
  },
  {
    id: '5',
    name: 'Relaxamento',
    description: 'Tratamento para cabelos crespos',
    duration: 90,
    price: 120,
    isActive: false,
    appointmentsThisMonth: 0,
  },
]

function fmt(n: number) {
  return `R$ ${n.toFixed(2).replace('.', ',')}`
}

const inputCls =
  'w-full h-9 px-3 rounded-md border border-zinc-200 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition'
const labelCls = 'text-xs font-medium text-zinc-700'

export default function ServicesPage() {
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [selected, setSelected] = useState<Service | null>(null)
  const [services, setServices] = useState(initialServices)

  const filtered = services.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase()),
  )

  function openEdit(service: Service) {
    setSelected(service)
    setModal('edit')
  }

  function closeModal() {
    setModal(null)
    setSelected(null)
  }

  function toggleActive(id: string) {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s)))
  }

  return (
    <>
      <Topbar
        title="Serviços"
        description="Gerencie o catálogo de serviços"
        actions={
          <button
            type="button"
            onClick={() => setModal('create')}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-zinc-900 text-white rounded-md hover:bg-zinc-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Novo serviço
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
            placeholder="Buscar serviço..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-md border border-zinc-200 bg-white text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
          />
        </div>

        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm" aria-label="Lista de serviços">
            <thead>
              <tr className="border-b bg-zinc-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Serviço
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden md:table-cell">
                  Duração
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Preço
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden lg:table-cell">
                  Agendamentos (mês)
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Ativo
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-zinc-400">
                    Nenhum serviço encontrado
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900">{s.name}</p>
                      {s.description && (
                        <p className="text-xs text-zinc-400 mt-0.5">{s.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="flex items-center gap-1 text-zinc-500 text-xs">
                        <Clock className="w-3 h-3" aria-hidden="true" />
                        {s.duration} min
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-900">{fmt(s.price)}</td>
                    <td className="px-4 py-3 text-zinc-500 hidden lg:table-cell">
                      {s.appointmentsThisMonth}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        aria-label={s.isActive ? `Desativar ${s.name}` : `Ativar ${s.name}`}
                        onClick={() => toggleActive(s.id)}
                        className={`relative w-9 h-[18px] rounded-full transition-colors ${
                          s.isActive ? 'bg-zinc-900' : 'bg-zinc-200'
                        }`}
                      >
                        <span
                          className={`absolute top-[1px] w-4 h-4 rounded-full bg-white shadow transition-transform ${
                            s.isActive ? 'translate-x-[18px]' : 'translate-x-[1px]'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        aria-label={`Editar ${s.name}`}
                        onClick={() => openEdit(s)}
                        className="p-1 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
                {modal === 'create' ? 'Novo serviço' : 'Editar serviço'}
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
                <label htmlFor="svc-name" className={labelCls}>
                  Nome do serviço
                </label>
                <input
                  id="svc-name"
                  type="text"
                  defaultValue={selected?.name}
                  placeholder="Ex: Corte + Barba"
                  className={inputCls}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="svc-desc" className={labelCls}>
                  Descrição
                </label>
                <textarea
                  id="svc-desc"
                  defaultValue={selected?.description}
                  placeholder="Descrição do serviço..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-md border border-zinc-200 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="svc-duration" className={labelCls}>
                    Duração (min)
                  </label>
                  <input
                    id="svc-duration"
                    type="number"
                    defaultValue={selected?.duration}
                    placeholder="30"
                    min="5"
                    step="5"
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="svc-price" className={labelCls}>
                    Preço (R$)
                  </label>
                  <input
                    id="svc-price"
                    type="number"
                    defaultValue={selected?.price}
                    placeholder="0,00"
                    step="0.01"
                    min="0"
                    className={inputCls}
                  />
                </div>
              </div>

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
                  {modal === 'create' ? 'Criar serviço' : 'Salvar alterações'}
                </button>
              </div>
            </form>
          </dialog>
        </div>
      )}
    </>
  )
}
