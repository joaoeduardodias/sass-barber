# Landing Page — Alinhamento de Cores Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir classes Tailwind hardcoded (zinc/white) na landing page pelas variáveis CSS do projeto e adicionar o `ThemeToggle` ao header.

**Architecture:** Alteração em arquivo único (`app/page.tsx`). As variáveis CSS já estão definidas em `globals.css` e o componente `ThemeToggle` já existe em `src/components/theme-toggle.tsx`. Nenhuma nova dependência ou arquivo de componente é necessário.

**Tech Stack:** Next.js 15 App Router, Tailwind CSS (via CSS custom properties), `next-themes`, Vitest + Testing Library

---

## File Map

| Ação | Arquivo |
|---|---|
| Modificar | `src/apps/web/src/app/page.tsx` |
| Criar | `src/apps/web/src/__tests__/landing-page.test.tsx` |

---

### Task 1: Escrever teste que verifica o ThemeToggle na landing page

**Files:**
- Create: `src/apps/web/src/__tests__/landing-page.test.tsx`

- [ ] **Step 1: Criar o arquivo de teste**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
}))

import Home from '../app/page'

describe('Landing page', () => {
  it('renders the theme toggle button', () => {
    render(<Home />)
    expect(screen.getByRole('button', { name: 'Alternar tema' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

```bash
pnpm --filter=@barber/web test src/__tests__/landing-page.test.tsx
```

Esperado: FAIL com `Unable to find an accessible element with the role "button" and name "Alternar tema"` (ThemeToggle ainda não está na página).

---

### Task 2: Atualizar `page.tsx` com variáveis CSS e ThemeToggle

**Files:**
- Modify: `src/apps/web/src/app/page.tsx`

- [ ] **Step 1: Substituir o conteúdo completo do arquivo**

```tsx
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
```

- [ ] **Step 2: Rodar o teste e confirmar que passa**

```bash
pnpm --filter=@barber/web test src/__tests__/landing-page.test.tsx
```

Esperado: PASS

- [ ] **Step 3: Rodar todos os testes do web app para confirmar que não há regressões**

```bash
pnpm --filter=@barber/web test
```

Esperado: todos os testes passam.

- [ ] **Step 4: Verificar visualmente em http://localhost:3000**

Confirmar:
- Fundo levemente creme/quente (não branco puro) no modo claro
- Botões "Começar grátis" em laranja/âmbar (cor primária), não preto
- Logo icon também em laranja
- ThemeToggle visível no canto direito do header
- Ao clicar no ThemeToggle, página alterna para dark mode com fundo escuro quente

- [ ] **Step 5: Commit**

```bash
git add src/apps/web/src/app/page.tsx src/apps/web/src/__tests__/landing-page.test.tsx
git commit -m "feat(web): align landing page colors with app palette and add theme toggle"
```
