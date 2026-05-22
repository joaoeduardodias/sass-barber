interface TopbarProps {
  title: string
  description?: string
  actions?: React.ReactNode
}

export function Topbar({ title, description, actions }: TopbarProps) {
  return (
    <header className="h-14 flex items-center justify-between px-6 bg-white border-b shrink-0">
      <div className="min-w-0">
        <h1 className="text-sm font-semibold text-zinc-900 truncate">{title}</h1>
        {description && <p className="text-xs text-zinc-400 truncate mt-0.5">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 ml-4 shrink-0">{actions}</div>}
    </header>
  )
}
