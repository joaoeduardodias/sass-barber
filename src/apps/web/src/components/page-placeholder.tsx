import { Topbar } from '@/components/topbar'
import type { LucideIcon } from 'lucide-react'

export function PagePlaceholder({
  title,
  description,
  icon: Icon,
  message,
}: {
  title: string
  description: string
  icon: LucideIcon
  message: string
}) {
  return (
    <>
      <Topbar title={title} description={description} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-lg border border-dashed text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Icon className="h-6 w-6" />
          </span>
          <p className="mt-4 text-sm font-medium">{message}</p>
          <p className="mt-1 text-xs text-muted-foreground">Em breve nesta seção.</p>
        </div>
      </main>
    </>
  )
}
