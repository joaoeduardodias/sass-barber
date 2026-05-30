import { PagePlaceholder } from '@/components/page-placeholder'
import { CalendarDays } from 'lucide-react'

export default function AppointmentsPage() {
  return (
    <PagePlaceholder
      title="Agendamentos"
      description="Gerencie os horários da sua barbearia"
      icon={CalendarDays}
      message="Seus agendamentos aparecerão aqui"
    />
  )
}
