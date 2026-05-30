import { listMyAppointments } from '@/lib/appointments/queries'
import type { AppointmentWithDetails } from '@barber/types'
import { Calendar, Clock, Scissors } from 'lucide-react'
import Link from 'next/link'
import { CancelButton } from './cancel-button'

export const metadata = { title: 'Meus Agendamentos' }

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
  NO_SHOW: 'Não compareceu',
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-zinc-100 text-zinc-700',
  CANCELLED: 'bg-red-100 text-red-700',
  NO_SHOW: 'bg-orange-100 text-orange-700',
}

function AppointmentCard({
  appointment,
  showCancel,
}: {
  appointment: AppointmentWithDetails
  showCancel: boolean
}) {
  const date = new Date(appointment.scheduledAt)
  return (
    <div className="flex items-start justify-between rounded-lg border bg-card p-4">
      <div className="flex gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
          <Scissors className="h-5 w-5 text-amber-700" />
        </div>
        <div>
          <p className="font-medium">{appointment.service.name}</p>
          <p className="text-sm text-muted-foreground">com {appointment.barber.user.name}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {date.toLocaleDateString('pt-BR', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[appointment.status] ?? 'bg-zinc-100 text-zinc-700'}`}
            >
              {STATUS_LABELS[appointment.status] ?? appointment.status}
            </span>
          </div>
        </div>
      </div>
      {showCancel && <CancelButton appointmentId={appointment.id} />}
    </div>
  )
}

export default async function MinhaContaPage() {
  const appointments = await listMyAppointments()

  const upcoming = appointments.filter((a) =>
    ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(a.status),
  )
  const history = appointments.filter((a) =>
    ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(a.status),
  )

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-8 text-xl font-semibold">Meus Agendamentos</h1>

      <section className="mb-10">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Próximos
        </h2>
        {upcoming.length === 0 ? (
          <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
            Nenhum agendamento próximo.{' '}
            <Link href="/" className="text-amber-600 underline">
              Agendar agora
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {upcoming.map((a) => (
              <AppointmentCard
                key={a.id}
                appointment={a}
                showCancel={['PENDING', 'CONFIRMED'].includes(a.status)}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Histórico
        </h2>
        {history.length === 0 ? (
          <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
            Nenhum histórico ainda.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map((a) => (
              <AppointmentCard key={a.id} appointment={a} showCancel={false} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
