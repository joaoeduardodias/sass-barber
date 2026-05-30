'use server'

import { apiFetch } from '@/lib/api/server'
import type {
  Barber,
  InviteBarberInput,
  InviteBarberResult,
  UpdateBarberInput,
} from '@barber/types'
import { revalidatePath } from 'next/cache'

function shopHeader(barbershopId: string) {
  return { 'x-barbershop-id': barbershopId }
}

export async function inviteBarberAction(
  barbershopId: string,
  input: InviteBarberInput,
): Promise<InviteBarberResult> {
  const result = await apiFetch<InviteBarberResult>('/barbers', {
    method: 'POST',
    headers: shopHeader(barbershopId),
    body: JSON.stringify(input),
  })
  revalidatePath('/barbers')
  return result
}

export async function updateBarberAction(
  barbershopId: string,
  id: string,
  input: UpdateBarberInput,
): Promise<Barber> {
  const barber = await apiFetch<Barber>(`/barbers/${id}`, {
    method: 'PATCH',
    headers: shopHeader(barbershopId),
    body: JSON.stringify(input),
  })
  revalidatePath('/barbers')
  return barber
}

export async function deleteBarberAction(barbershopId: string, id: string): Promise<void> {
  await apiFetch(`/barbers/${id}`, {
    method: 'DELETE',
    headers: shopHeader(barbershopId),
  })
  revalidatePath('/barbers')
}
