import { PagePlaceholder } from '@/components/page-placeholder'
import { Tag } from 'lucide-react'

export default function ServicesPage() {
  return (
    <PagePlaceholder
      title="Serviços"
      description="Gerencie os serviços oferecidos"
      icon={Tag}
      message="Seus serviços aparecerão aqui"
    />
  )
}
