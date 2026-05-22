'use client'

import { Topbar } from '@/components/topbar'
import { MoreHorizontal, Plus, Search, X } from 'lucide-react'
import { useState } from 'react'

type Status = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'

interface Appointment {
  id: string
  date: string
  time: string
  client: string
  barber: string
  service: string
  duration: number
  price: string
  status: Status
  notes?: string
}

const statusConfig: Record<Status, { label: string; className: string }> = {
  PENDING: { label: 'Pendente', className: 'bg-amber-50 text-amber-700' },
  CONFIRMED: { label: 'Confirmado', className: 'bg-emerald-50 text-emerald-700' },
  IN_PROGRESS: { label: 'Em andamento', className: 'bg-blue-50 text-blue-700' },
  COMPLETED: { label: 'Concluído', className: 'bg-zinc-100 text-zinc-600' },
  CANCELLED: { label: 'Cancelado', className: 'bg-red-50 text-red-600' },
  NO_SHOW: { label: 'Não compareceu', className: 'bg-orange-50 text-orange-600' },
}

const initialAppointments: Appointment[] = [
  {
    id: '1',
    date: '2026-05-22',
    time: '09:00',
    client: 'Rafael Moura',
    barber: 'Diego',
    service: 'Corte + Barba',
    duration: 60,
    price: 'R$ 65,00',
    status: 'CONFIRMED',
  },
  {
    id: '2',
    date: '2026-05-22',
    time: '09:30',
    client: 'Lucas Ferreira',
    barber: 'André',
    service: 'Corte',
    duration: 30,
    price: 'R$ 35,00',
    status: 'CONFIRMED',
  },
  {
    id: '3',
    date: '2026-05-22',
    time: '10:00',
    client: 'Matheus Costa',
    barber: 'Diego',
    service: 'Barba',
    duration: 30,
    price: 'R$ 30,00',
    status: 'PENDING',
  },
  {
    id: '4',
    date: '2026-05-22',
    time: '10:30',
    client: 'Bruno Lima',
    barber: 'Pedro',
    service: 'Corte + Barba',
    duration: 60,
    price: 'R$ 65,00',
    status: 'CONFIRMED',
  },
  {
    id: '5',
    date: '2026-05-22',
    time: '11:00',
    client: 'Gabriel Souza',
    barber: 'André',
    service: 'Corte',
    duration: 30,
    price: 'R$ 35,00',
    status: 'IN_PROGRESS',
  },
  {
    id: '6',
    date: '2026-05-22',
    time: '14:00',
    client: 'Fernando Alves',
    barber: 'Pedro',
    service: 'Corte',
    duration: 30,
    price: 'R$ 35,00',
    status: 'PENDING',
  },
  {
    id: '7',
    date: '2026-05-22',
    time: '15:00',
    client: 'Ricardo Nunes',
    barber: 'Diego',
    service: 'Corte + Barba',
    duration: 60,
    price: 'R$ 65,00',
    status: 'CANCELLED',
  },
  {
    id: '8',
    date: '2026-05-21',
    time: '09:00',
    client: 'Julio Martins',
    barber: 'André',
    service: 'Barba',
    duration: 30,
    price: 'R$ 30,00',
    status: 'COMPLETED',
  },
  {
    id: '9',
    date: '2026-05-21',
    time: '14:30',
    client: 'Thiago Rocha',
    barber: 'Pedro',
    service: 'Corte',
    duration: 30,
    price: 'R$ 35,00',
    status: 'COMPLETED',
  },
  {
    id: '10',
    date: '2026-05-20',
    time: '10:00',
    client: 'Caio Mendes',
    barber: 'Diego',
    service: 'Hidratação',
    duration: 45,
    price: 'R$ 50,00',
    status: 'NO_SHOW',
  },
]

const barbers = ['Diego', 'André', 'Pedro']
const services = ['Corte', 'Barba', 'Corte + Barba', 'Hidratação']

const inputCls =
  'w-full h-9 px-3 rounded-md border border-zinc-200 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition'
const selectCls =
  'w-full h-9 px-3 rounded-md border border-zinc-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition'
const labelCls = 'text-xs font-medium text-zinc-700'

export default function AppointmentsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<Status | 'ALL'>('ALL')
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [selected, setSelected] = useState<Appointment | null>(null)
  const [appointments] = useState(initialAppointments)

  const filtered = appointments.filter((a) => {
    const matchesSearch =
      a.client.toLowerCase().includes(search.toLowerCase()) ||
      a.barber.toLowerCase().includes(search.toLowerCase()) ||
      a.service.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter
    return matchesSearch && matchesStatus
  })

  function openEdit(appt: Appointment) {
    setSelected(appt)
    setModal('edit')
  }

  function closeModal() {
    setModal(null)
    setSelected(null)
  }

  const filterButtons: Array<{ key: Status | 'ALL'; label: string }> = [
    { key: 'ALL', label: 'Todos' },
    { key: 'PENDING', label: 'Pendente' },
    { key: 'CONFIRMED', label: 'Confirmado' },
    { key: 'IN_PROGRESS', label: 'Em andamento' },
    { key: 'COMPLETED', label: 'Concluído' },
    { key: 'CANCELLED', label: 'Cancelado' },
  ]

  return (
    <>
      <Topbar
        title="Agendamentos"
        description="Gerencie todos os agendamentos da barbearia"
        actions={
          <button
            type="button"
            onClick={() => setModal('create')}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-zinc-900 text-white rounded-md hover:bg-zinc-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Novo agendamento
          </button>
        }
      />

      <main className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400"
              aria-hidden="true"
            />
            <input
              type="text"
              placeholder="Buscar cliente, barbeiro..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-md border border-zinc-200 bg-white text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {filterButtons.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  statusFilter === key
                    ? 'bg-zinc-900 text-white'
                    : 'bg-white border text-zinc-500 hover:bg-zinc-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm" aria-label="Lista de agendamentos">
            <thead>
              <tr className="border-b bg-zinc-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Data / Hora
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Cliente
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden md:table-cell">
                  Barbeiro
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden lg:table-cell">
                  Serviço
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden lg:table-cell">
                  Valor
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-zinc-400">
                    Nenhum agendamento encontrado
                  </td>
                </tr>
              ) : (
                filtered.map((a) => {
                  const { label, className } = statusConfig[a.status]
                  return (
                    <tr key={a.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs font-medium text-zinc-700">{a.time}</p>
                        <p className="text-xs text-zinc-400">{a.date}</p>
                      </td>
                      <td className="px-4 py-3 font-medium text-zinc-900">{a.client}</td>
                      <td className="px-4 py-3 text-zinc-500 hidden md:table-cell">{a.barber}</td>
                      <td className="px-4 py-3 text-zinc-500 hidden lg:table-cell">{a.service}</td>
                      <td className="px-4 py-3 font-medium text-zinc-700 hidden lg:table-cell">
                        {a.price}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${className}`}
                        >
                          {label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          aria-label={`Editar agendamento de ${a.client}`}
                          onClick={() => openEdit(a)}
                          className="p-1 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
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
                {modal === 'create' ? 'Novo agendamento' : 'Editar agendamento'}
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="apt-date" className={labelCls}>
                    Data
                  </label>
                  <input
                    id="apt-date"
                    type="date"
                    defaultValue={selected?.date ?? '2026-05-22'}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="apt-time" className={labelCls}>
                    Horário
                  </label>
                  <input
                    id="apt-time"
                    type="time"
                    defaultValue={selected?.time}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="apt-client" className={labelCls}>
                  Cliente
                </label>
                <input
                  id="apt-client"
                  type="text"
                  defaultValue={selected?.client}
                  placeholder="Nome do cliente"
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="apt-barber" className={labelCls}>
                    Barbeiro
                  </label>
                  <select id="apt-barber" defaultValue={selected?.barber} className={selectCls}>
                    {barbers.map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="apt-service" className={labelCls}>
                    Serviço
                  </label>
                  <select id="apt-service" defaultValue={selected?.service} className={selectCls}>
                    {services.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {modal === 'edit' && (
                <div className="space-y-1.5">
                  <label htmlFor="apt-status" className={labelCls}>
                    Status
                  </label>
                  <select id="apt-status" defaultValue={selected?.status} className={selectCls}>
                    {Object.entries(statusConfig).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="apt-notes" className={labelCls}>
                  Observações
                </label>
                <textarea
                  id="apt-notes"
                  defaultValue={selected?.notes}
                  placeholder="Observações opcionais..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-md border border-zinc-200 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition resize-none"
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
                  {modal === 'create' ? 'Criar agendamento' : 'Salvar alterações'}
                </button>
              </div>
            </form>
          </dialog>
        </div>
      )}
    </>
  )
}
