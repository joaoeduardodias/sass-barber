import { ThemeToggle } from '@/components/theme-toggle'
import { CalendarDays, Scissors, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'

const features = [
  {
    icon: CalendarDays,
    title: 'Agendamentos online',
    description: 'Clientes agendam 24h por dia, sem telefonemas.',
  },
  {
    icon: Users,
    title: 'Gestão de equipe',
    description: 'Controle a agenda de cada barbeiro individualmente.',
  },
  {
    icon: TrendingUp,
    title: 'Relatórios em tempo real',
    description: 'Receita, ocupação e ticket médio sempre atualizados.',
  },
  {
    icon: Scissors,
    title: 'Catálogo de serviços',
    description: 'Gerencie preços e duração de cada serviço com facilidade.',
  },
]

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 h-14 border-b bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
            <Scissors className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground text-sm">BarberSaaS</span>
        </div>
        <nav className="flex items-center gap-1">
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors font-medium"
          >
            Começar grátis
          </Link>
          <ThemeToggle />
        </nav>
      </header>

      <main>
        <section className="flex flex-col items-center justify-center text-center px-6 py-24 md:py-36 border-b">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-5">
            Gestão para barbearias
          </p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground max-w-3xl leading-[1.1] mb-5">
            Sua barbearia organizada, do agendamento ao caixa
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-xl mb-10 leading-relaxed">
            Agendamentos online, gestão de barbeiros, controle de serviços e relatórios financeiros
            em uma plataforma simples.
          </p>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <Link
              href="/register"
              className="bg-primary text-primary-foreground px-5 py-2.5 rounded-md hover:bg-primary/90 transition-colors font-medium text-sm"
            >
              Começar grátis
            </Link>
            <Link
              href="/login"
              className="text-muted-foreground hover:text-foreground font-medium transition-colors text-sm px-5 py-2.5 rounded-md border border-border hover:bg-accent hover:text-accent-foreground"
            >
              Já tenho conta
            </Link>
          </div>
        </section>

        <section className="px-6 py-20 md:py-28 max-w-5xl mx-auto">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest text-center mb-12">
            Tudo que sua barbearia precisa
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border rounded-xl overflow-hidden">
            {features.map(({ icon: Icon, title, description }) => (
              <article key={title} className="bg-card p-6 flex flex-col gap-3">
                <div className="w-8 h-8 bg-secondary rounded-md flex items-center justify-center">
                  <Icon className="w-4 h-4 text-foreground" />
                </div>
                <h3 className="font-semibold text-foreground text-sm">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="mt-auto border-t px-6 h-12 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">© 2026 BarberSaaS</p>
        <p className="text-xs text-muted-foreground">Feito para barbeiros brasileiros</p>
      </footer>
    </div>
  )
}
