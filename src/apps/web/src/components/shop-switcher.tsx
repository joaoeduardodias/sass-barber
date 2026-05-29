'use client'

import { setActiveBarbershopAction } from '@/lib/barbershops/actions'
import { ACTIVE_BARBERSHOP_COOKIE } from '@/lib/tenant'
import type { Barbershop } from '@barber/types'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@barber/ui'
import { Check, ChevronsUpDown, Plus, Store } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { CreateShopDialog } from './create-shop-dialog'

function hasActiveCookie() {
  if (typeof document === 'undefined') return true
  return document.cookie.split('; ').some((c) => c.startsWith(`${ACTIVE_BARBERSHOP_COOKIE}=`))
}

export function ShopSwitcher({
  shops,
  activeId,
}: {
  shops: Barbershop[]
  activeId: string | null
}) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [, startTransition] = useTransition()

  useEffect(() => {
    if (activeId && !hasActiveCookie()) {
      startTransition(async () => {
        await setActiveBarbershopAction(activeId)
        router.refresh()
      })
    }
  }, [activeId, router])

  const active = shops.find((s) => s.id === activeId) ?? null

  function selectShop(id: string) {
    if (id === activeId) return
    startTransition(async () => {
      await setActiveBarbershopAction(id)
      router.refresh()
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between gap-2"
            aria-label="Trocar de barbearia"
          >
            <span className="flex items-center gap-2 truncate">
              <Store className="h-4 w-4 shrink-0" />
              <span className="truncate">{active?.name ?? 'Selecione...'}</span>
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]" align="start">
          <DropdownMenuLabel>Barbearias</DropdownMenuLabel>
          {shops.map((shop) => (
            <DropdownMenuItem key={shop.id} onSelect={() => selectShop(shop.id)}>
              <Store className="h-4 w-4" />
              <span className="truncate">{shop.name}</span>
              {shop.id === activeId && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
          ))}
          {shops.length === 0 && (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">Nenhuma barbearia</p>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Nova barbearia
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CreateShopDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  )
}
