'use server'

import { apiFetch } from '@/lib/api/server'
import { revalidatePath } from 'next/cache'

export async function cancelAppointmentAction(id: string): Promise<void> {
  await apiFetch(`/appointments/${id}/cancel`, { method: 'PATCH' })
  revalidatePath('/minha-conta')
}
