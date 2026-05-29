'use server'

import { apiFetch } from '@/lib/api/server'
import { setActiveBarbershopId } from '@/lib/tenant.server'
import type { Barbershop, CreateBarbershopInput, UpdateBarbershopInput } from '@barber/types'
import { revalidatePath } from 'next/cache'

export async function createBarbershopAction(input: CreateBarbershopInput): Promise<Barbershop> {
  const shop = await apiFetch<Barbershop>('/barbershops', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  await setActiveBarbershopId(shop.id)
  revalidatePath('/', 'layout')
  return shop
}

export async function updateBarbershopAction(
  id: string,
  input: UpdateBarbershopInput,
): Promise<Barbershop> {
  const shop = await apiFetch<Barbershop>(`/barbershops/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  revalidatePath('/settings')
  revalidatePath('/', 'layout')
  return shop
}

export async function setActiveBarbershopAction(id: string): Promise<void> {
  await setActiveBarbershopId(id)
  revalidatePath('/', 'layout')
}
