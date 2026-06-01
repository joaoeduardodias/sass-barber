# Customer Services Upsell — Design Spec

**Data:** 2026-06-01
**Escopo:** `/minha-conta` — tela do cliente

## Objetivo

Aumentar conversão de novos agendamentos exibindo os serviços disponíveis da barbearia mais frequentada pelo cliente diretamente na tela de minha conta, lado a lado com a lista de agendamentos.

## Layout

A página muda de coluna única (`max-w-2xl` centralizado) para um grid de duas colunas em telas médias+:

- **Coluna esquerda:** agendamentos (próximos + histórico) — conteúdo existente, sem mudanças
- **Coluna direita:** seção "Serviços em [Nome da Barbearia]" com cards de serviço e CTA de agendamento

Em mobile (telas pequenas), as colunas empilham verticalmente: agendamentos primeiro, serviços abaixo.

Se o cliente não tiver nenhum agendamento (histórico vazio), a coluna direita não é renderizada e a página volta ao layout de coluna única.

## Dados

### Fonte dos serviços

1. `listMyAppointments()` já é chamado na página — pegar o appointment mais recente (qualquer status) para obter `barbershop.slug` e `barbershop.name`
2. Chamar `listPublicServices(slug)` com esse slug — função já existente em `src/apps/web/src/lib/public/queries.ts`

### Mudança necessária em `AppointmentWithDetails`

`AppointmentWithDetails.barbershop` hoje é `{ id: string; name: string }`. Adicionar `slug: string`.

**Arquivos afetados:**
- `src/packages/types/src/schemas/appointment.ts` — adicionar `slug` no type
- `src/apps/api/src/routes/appointments.ts` — adicionar `slug` no select Prisma do endpoint `/appointments/my`

## Card de serviço

Cada serviço na coluna direita exibe:
- Nome do serviço
- Duração (ex: "30 min")
- Preço formatado (ex: "R$ 35,00")
- Botão "Agendar" → link para `/b/[slug]/agendar`

## Comportamento condicional

| Condição | Comportamento |
|---|---|
| Cliente tem pelo menos 1 appointment (qualquer status) | Layout 2 colunas, mostra serviços da barbearia mais recente |
| Cliente não tem nenhum appointment | Layout coluna única (como hoje) |
| API de serviços retorna lista vazia | Coluna direita não renderizada |

## Arquivos modificados

| Ação | Arquivo |
|---|---|
| Modificar | `src/packages/types/src/schemas/appointment.ts` |
| Modificar | `src/apps/api/src/routes/appointments.ts` |
| Modificar | `src/apps/web/src/app/(customer)/minha-conta/page.tsx` |

## O que NÃO muda

- Fluxo de booking público (`/b/[slug]/agendar`) — nenhuma alteração
- Componente `AppointmentCard` — sem mudanças
- Layout do header do customer — sem mudanças
- Nenhum novo estado client-side
