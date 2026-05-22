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
    <div className="min-h-screen flex flex-col bg-white">
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 h-14 border-b bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-zinc-900 rounded flex items-center justify-center">
            <Scissors className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-zinc-900 text-sm">BarberSaaS</span>
        </div>
        <nav className="flex items-center gap-1">
          <Link
            href="/login"
            className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors px-3 py-1.5 rounded-md hover:bg-zinc-50"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="text-sm bg-zinc-900 text-white px-3 py-1.5 rounded-md hover:bg-zinc-700 transition-colors font-medium"
          >
            Começar grátis
          </Link>
        </nav>
      </header>

      <main>
        <section className="flex flex-col items-center justify-center text-center px-6 py-24 md:py-36 border-b">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-5">
            Gestão para barbearias
          </p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-zinc-900 max-w-3xl leading-[1.1] mb-5">
            Sua barbearia organizada, do agendamento ao caixa
          </h1>
          <p className="text-base md:text-lg text-zinc-500 max-w-xl mb-10 leading-relaxed">
            Agendamentos online, gestão de barbeiros, controle de serviços e relatórios financeiros
            em uma plataforma simples.
          </p>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <Link
              href="/register"
              className="bg-zinc-900 text-white px-5 py-2.5 rounded-md hover:bg-zinc-700 transition-colors font-medium text-sm"
            >
              Começar grátis
            </Link>
            <Link
              href="/login"
              className="text-zinc-600 hover:text-zinc-900 font-medium transition-colors text-sm px-5 py-2.5 rounded-md border hover:bg-zinc-50"
            >
              Já tenho conta
            </Link>
          </div>
        </section>

        <section className="px-6 py-20 md:py-28 max-w-5xl mx-auto">
          <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-widest text-center mb-12">
            Tudo que sua barbearia precisa
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-200 border border-zinc-200 rounded-xl overflow-hidden">
            {features.map(({ icon: Icon, title, description }) => (
              <article key={title} className="bg-white p-6 flex flex-col gap-3">
                <div className="w-8 h-8 bg-zinc-100 rounded-md flex items-center justify-center">
                  <Icon className="w-4 h-4 text-zinc-700" />
                </div>
                <h3 className="font-semibold text-zinc-900 text-sm">{title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="mt-auto border-t px-6 h-12 flex items-center justify-between">
        <p className="text-xs text-zinc-400">© 2026 BarberSaaS</p>
        <p className="text-xs text-zinc-400">Feito para barbeiros brasileiros</p>
      </footer>
    </div>
  )
}
