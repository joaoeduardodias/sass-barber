import { PagePlaceholder } from '@/components/page-placeholder'
import { Scissors } from 'lucide-react'

export default function BarbersPage() {
  return (
    <PagePlaceholder
      title="Barbeiros"
      description="Gerencie a sua equipe"
      icon={Scissors}
      message="Sua equipe aparecerá aqui"
    />
  )
}
