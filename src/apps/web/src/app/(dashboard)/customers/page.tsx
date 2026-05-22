'use client'

import { Topbar } from '@/components/topbar'
import { CalendarDays, Mail, MoreHorizontal, Phone, Plus, Search, X } from 'lucide-react'
import { useState } from 'react'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  totalVisits: number
  totalSpent: number
  lastVisit: string
  since: string
}

const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Rafael Moura',
    email: 'rafael@gmail.com',
    phone: '(11) 99999-1111',
    totalVisits: 18,
    totalSpent: 1170,
    lastVisit: '2026-05-22',
    since: '2025-03-10',
  },
  {
    id: '2',
    name: 'Lucas Ferreira',
    email: 'lucas@gmail.com',
    phone: '(11) 99999-2222',
    totalVisits: 12,
    totalSpent: 420,
    lastVisit: '2026-05-22',
    since: '2025-06-15',
  },
  {
    id: '3',
    name: 'Matheus Costa',
    email: 'matheus@gmail.com',
    phone: '(11) 99999-3333',
    totalVisits: 8,
    totalSpent: 240,
    lastVisit: '2026-05-22',
    since: '2025-09-01',
  },
  {
    id: '4',
    name: 'Bruno Lima',
    email: 'bruno@gmail.com',
    phone: '(11) 99999-4444',
    totalVisits: 24,
    totalSpent: 1560,
    lastVisit: '2026-05-22',
    since: '2024-12-20',
  },
  {
    id: '5',
    name: 'Gabriel Souza',
    email: 'gabriel@gmail.com',
    phone: '(11) 99999-5555',
    totalVisits: 6,
    totalSpent: 210,
    lastVisit: '2026-05-22',
    since: '2026-01-08',
  },
  {
    id: '6',
    name: 'Fernando Alves',
    email: 'fernando@gmail.com',
    phone: '(11) 99999-6666',
    totalVisits: 3,
    totalSpent: 105,
    lastVisit: '2026-05-20',
    since: '2026-03-15',
  },
  {
    id: '7',
    name: 'Ricardo Nunes',
    email: 'ricardo@gmail.com',
    phone: '(11) 99999-7777',
    totalVisits: 15,
    totalSpent: 975,
    lastVisit: '2026-05-18',
    since: '2025-01-05',
  },
  {
    id: '8',
    name: 'Julio Martins',
    email: 'julio@gmail.com',
    phone: '(11) 99999-8888',
    totalVisits: 9,
    totalSpent: 315,
    lastVisit: '2026-05-21',
    since: '2025-07-22',
  },
  {
    id: '9',
    name: 'Thiago Rocha',
    email: 'thiago@gmail.com',
    phone: '(11) 99999-9999',
    totalVisits: 5,
    totalSpent: 175,
    lastVisit: '2026-05-21',
    since: '2026-02-14',
  },
  {
    id: '10',
    name: 'Caio Mendes',
    email: 'caio@gmail.com',
    phone: '(11) 98888-0000',
    totalVisits: 2,
    totalSpent: 65,
    lastVisit: '2026-05-15',
    since: '2026-04-30',
  },
]

function fmt(n: number) {
  return `R$ ${n.toFixed(2).replace('.', ',')}`
}

function fmtDate(d: string) {
  return new Date(`${d}T00:00:00`).toLocaleDateString('pt-BR')
}

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

export default function CustomersPage() {
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<'view' | 'create' | null>(null)
  const [selected, setSelected] = useState<Customer | null>(null)

  const filtered = mockCustomers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search),
  )

  function openView(customer: Customer) {
    setSelected(customer)
    setModal('view')
  }

  function closeModal() {
    setModal(null)
    setSelected(null)
  }

  return (
    <>
      <Topbar
        title="Clientes"
        description="Todos os clientes da barbearia"
        actions={
          <button
            type="button"
            onClick={() => setModal('create')}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-zinc-900 text-white rounded-md hover:bg-zinc-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Novo cliente
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
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-md border border-zinc-200 bg-white text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
          />
        </div>

        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm" aria-label="Lista de clientes">
            <thead>
              <tr className="border-b bg-zinc-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Cliente
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden md:table-cell">
                  Contato
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden lg:table-cell">
                  Visitas
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden lg:table-cell">
                  Total gasto
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden md:table-cell">
                  Última visita
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-zinc-400">
                    Nenhum cliente encontrado
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 border flex items-center justify-center text-zinc-700 text-xs font-semibold shrink-0">
                          {initials(c.name)}
                        </div>
                        <div>
                          <p className="font-medium text-zinc-900">{c.name}</p>
                          <p className="text-xs text-zinc-400">desde {fmtDate(c.since)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-zinc-500 text-xs">{c.email}</p>
                      <p className="text-zinc-400 text-xs">{c.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-700 font-medium hidden lg:table-cell">
                      {c.totalVisits}x
                    </td>
                    <td className="px-4 py-3 text-zinc-700 font-medium hidden lg:table-cell">
                      {fmt(c.totalSpent)}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs hidden md:table-cell">
                      {fmtDate(c.lastVisit)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        aria-label={`Ver detalhes de ${c.name}`}
                        onClick={() => openView(c)}
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

      {modal === 'view' && selected && (
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
            className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 m-0 border-0"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-zinc-900">Detalhes do cliente</h2>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Fechar"
                className="p-1 rounded hover:bg-zinc-100 text-zinc-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col items-center gap-3 mb-5">
              <div className="w-14 h-14 rounded-full bg-zinc-900 flex items-center justify-center text-white text-lg font-semibold">
                {initials(selected.name)}
              </div>
              <div className="text-center">
                <p className="font-semibold text-zinc-900">{selected.name}</p>
                <p className="text-xs text-zinc-400">Cliente desde {fmtDate(selected.since)}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="text-center p-3 bg-zinc-50 rounded-lg">
                <p className="text-sm font-bold text-zinc-900">{selected.totalVisits}</p>
                <p className="text-xs text-zinc-400 mt-0.5">Visitas</p>
              </div>
              <div className="text-center p-3 bg-zinc-50 rounded-lg">
                <p className="text-sm font-bold text-zinc-900">{fmt(selected.totalSpent)}</p>
                <p className="text-xs text-zinc-400 mt-0.5">Total gasto</p>
              </div>
              <div className="text-center p-3 bg-zinc-50 rounded-lg">
                <p className="text-sm font-bold text-zinc-900">
                  {fmt(selected.totalSpent / selected.totalVisits)}
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">Ticket médio</p>
              </div>
            </div>

            <div className="space-y-2.5 border-t pt-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" aria-hidden="true" />
                <span className="text-zinc-600 truncate">{selected.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" aria-hidden="true" />
                <span className="text-zinc-600">{selected.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CalendarDays className="w-3.5 h-3.5 text-zinc-400 shrink-0" aria-hidden="true" />
                <span className="text-zinc-600">Última visita: {fmtDate(selected.lastVisit)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={closeModal}
              className="mt-5 w-full h-9 text-xs font-medium border rounded-md hover:bg-zinc-50 transition-colors text-zinc-600"
            >
              Fechar
            </button>
          </dialog>
        </div>
      )}

      {modal === 'create' && (
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
              <h2 className="text-sm font-semibold text-zinc-900">Novo cliente</h2>
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
                <label htmlFor="cust-name" className={labelCls}>
                  Nome completo
                </label>
                <input
                  id="cust-name"
                  type="text"
                  placeholder="Nome do cliente"
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="cust-email" className={labelCls}>
                  E-mail
                </label>
                <input
                  id="cust-email"
                  type="email"
                  placeholder="email@exemplo.com"
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="cust-phone" className={labelCls}>
                  Telefone
                </label>
                <input
                  id="cust-phone"
                  type="tel"
                  placeholder="(11) 99999-0000"
                  className={inputCls}
                />
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
                  Cadastrar cliente
                </button>
              </div>
            </form>
          </dialog>
        </div>
      )}
    </>
  )
}
