'use server'

import { apiFetch } from '@/lib/api/server'
import type { CreateServiceInput, Service, UpdateServiceInput } from '@barber/types'
import { revalidatePath } from 'next/cache'

function shopHeader(barbershopId: string) {
  return { 'x-barbershop-id': barbershopId }
}

export async function createServiceAction(
  barbershopId: string,
  input: CreateServiceInput,
): Promise<Service> {
  const service = await apiFetch<Service>('/services', {
    method: 'POST',
    headers: shopHeader(barbershopId),
    body: JSON.stringify(input),
  })
  revalidatePath('/services')
  return service
}

export async function updateServiceAction(
  barbershopId: string,
  id: string,
  input: UpdateServiceInput,
): Promise<Service> {
  const service = await apiFetch<Service>(`/services/${id}`, {
    method: 'PATCH',
    headers: shopHeader(barbershopId),
    body: JSON.stringify(input),
  })
  revalidatePath('/services')
  return service
}

export async function deleteServiceAction(barbershopId: string, id: string): Promise<void> {
  await apiFetch(`/services/${id}`, {
    method: 'DELETE',
    headers: shopHeader(barbershopId),
  })
  revalidatePath('/services')
}
