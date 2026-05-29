import { PagePlaceholder } from '@/components/page-placeholder'
import { LayoutDashboard } from 'lucide-react'

export default function DashboardPage() {
  return (
    <PagePlaceholder
      title="Dashboard"
      description="Visão geral da sua barbearia"
      icon={LayoutDashboard}
      message="Suas métricas aparecerão aqui"
    />
  )
}
