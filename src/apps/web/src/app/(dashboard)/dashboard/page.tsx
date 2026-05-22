import { Topbar } from '@/components/topbar'
import { CalendarDays, DollarSign, Scissors, TrendingUp, Users } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

const stats = [
  {
    label: 'Agendamentos hoje',
    value: '12',
    delta: '+3 vs ontem',
    positive: true,
    icon: CalendarDays,
  },
  {
    label: 'Clientes novos',
    value: '8',
    delta: '+2 este mês',
    positive: true,
    icon: Users,
  },
  {
    label: 'Receita do mês',
    value: 'R$ 4.280',
    delta: '+12% vs mês anterior',
    positive: true,
    icon: DollarSign,
  },
  {
    label: 'Barbeiros ativos',
    value: '4',
    delta: '2 disponíveis agora',
    positive: true,
    icon: Scissors,
  },
]

const appointments = [
  {
    time: '09:00',
    client: 'Rafael Moura',
    barber: 'Diego',
    service: 'Corte + Barba',
    status: 'confirmed',
  },
  {
    time: '09:30',
    client: 'Lucas Ferreira',
    barber: 'André',
    service: 'Corte',
    status: 'confirmed',
  },
  { time: '10:00', client: 'Matheus Costa', barber: 'Diego', service: 'Barba', status: 'pending' },
  {
    time: '10:30',
    client: 'Bruno Lima',
    barber: 'Pedro',
    service: 'Corte + Barba',
    status: 'confirmed',
  },
  { time: '11:00', client: 'Gabriel Souza', barber: 'André', service: 'Corte', status: 'pending' },
]

const statusLabel: Record<string, { label: string; className: string }> = {
  confirmed: { label: 'Confirmado', className: 'bg-emerald-50 text-emerald-700' },
  pending: { label: 'Pendente', className: 'bg-amber-50 text-amber-700' },
  cancelled: { label: 'Cancelado', className: 'bg-red-50 text-red-700' },
}

export default function DashboardPage() {
  return (
    <>
      <Topbar
        title="Dashboard"
        description="Visão geral da sua barbearia"
        actions={
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-zinc-900 text-white rounded-md hover:bg-zinc-700 transition-colors"
          >
            <CalendarDays className="w-3.5 h-3.5" aria-hidden="true" />
            Novo agendamento
          </button>
        }
      />

      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map(({ label, value, delta, positive, icon: Icon }) => (
            <article key={label} className="bg-white rounded-xl border p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-zinc-500">{label}</p>
                <div className="w-7 h-7 bg-zinc-50 border rounded-md flex items-center justify-center">
                  <Icon className="w-3.5 h-3.5 text-zinc-600" aria-hidden="true" />
                </div>
              </div>
              <p className="text-2xl font-bold text-zinc-900 tracking-tight">{value}</p>
              <p
                className={`text-xs font-medium flex items-center gap-1 ${positive ? 'text-emerald-600' : 'text-red-600'}`}
              >
                <TrendingUp className="w-3 h-3" aria-hidden="true" />
                {delta}
              </p>
            </article>
          ))}
        </div>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-900">Próximos agendamentos</h2>
            <a
              href="/appointments"
              className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors font-medium"
            >
              Ver todos →
            </a>
          </div>

          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm" aria-label="Próximos agendamentos">
              <thead>
                <tr className="border-b bg-zinc-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                    Horário
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
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {appointments.map(({ time, client, barber, service, status }) => {
                  const { label, className } = statusLabel[status]
                  return (
                    <tr key={`${time}-${client}`} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-medium text-zinc-700">
                        {time}
                      </td>
                      <td className="px-4 py-3 font-medium text-zinc-900">{client}</td>
                      <td className="px-4 py-3 text-zinc-500 hidden md:table-cell">{barber}</td>
                      <td className="px-4 py-3 text-zinc-500 hidden lg:table-cell">{service}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${className}`}
                        >
                          {label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  )
}
