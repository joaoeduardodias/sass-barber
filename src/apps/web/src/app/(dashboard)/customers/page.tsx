import { PagePlaceholder } from '@/components/page-placeholder'
import { Users } from 'lucide-react'

export default function CustomersPage() {
  return (
    <PagePlaceholder
      title="Clientes"
      description="Veja a sua base de clientes"
      icon={Users}
      message="Seus clientes aparecerão aqui"
    />
  )
}
