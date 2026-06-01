# Landing Page — Alinhamento de Cores com a Aplicação

**Data:** 2026-06-01
**Escopo:** `src/apps/web/src/app/page.tsx`

## Objetivo

Alinhar a landing page (`/`) ao esquema de cores já em uso no dashboard e demais páginas da aplicação, substituindo classes Tailwind hardcoded (zinc/white) pelas variáveis CSS definidas em `globals.css`. Adicionar suporte a dark mode e o botão `ThemeToggle` no header.

## Contexto

A landing page usa uma palette zinc/cinza hardcoded (`bg-white`, `bg-zinc-900`, `text-zinc-500`, etc.) que não participa das variáveis CSS do projeto. O restante da aplicação usa uma palette quente amber/laranja via custom properties (`--primary: 28 80% 45%`, `--background: 40 30% 98%`, etc.) com suporte a dark mode. A `globals.css` já define variáveis para `.dark` — só a landing page está fora desse sistema.

## Abordagem

Troca direta de variáveis. Nenhuma alteração estrutural, textual ou de layout.

## Mapeamento de Classes

| Antes (hardcoded) | Depois (CSS var) | Papel semântico |
|---|---|---|
| `bg-white` | `bg-background` | fundo da página |
| `bg-white/80` | `bg-background/80` | header com backdrop-blur |
| `text-zinc-900` | `text-foreground` | títulos e textos principais |
| `text-zinc-500`, `text-zinc-600` | `text-muted-foreground` | textos secundários e subtítulos |
| `text-zinc-400` | `text-muted-foreground` | textos do footer |
| `bg-zinc-900 text-white` (botão primário) | `bg-primary text-primary-foreground` | CTAs principais |
| `hover:bg-zinc-700` | `hover:bg-primary/90` | hover do botão primário |
| `border hover:bg-zinc-50` (botão outline) | `border-border hover:bg-accent hover:text-accent-foreground` | botão secundário |
| `bg-zinc-100` (fundo ícone feature) | `bg-secondary` | fundo dos ícones no grid |
| `text-zinc-700` (ícone feature) | `text-foreground` | cor dos ícones |
| `bg-zinc-200 border-zinc-200` (grid separator) | `bg-border border-border` | separadores do grid de features |

## ThemeToggle

- Importar `ThemeToggle` de `@/components/theme-toggle` (componente já existente).
- Inserir no `<nav>` do header, após os links "Entrar" / "Começar grátis".
- Sem novas dependências; o componente já usa as variáveis CSS do projeto.

## O que NÃO muda

- Estrutura HTML
- Textos, ícones, layout, responsividade
- Nenhum novo componente criado

## Arquivos Afetados

- `src/apps/web/src/app/page.tsx` — único arquivo modificado
