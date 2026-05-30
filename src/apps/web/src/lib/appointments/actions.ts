'use server'

import { apiFetch } from '@/lib/api/server'
import { revalidatePath } from 'next/cache'

export async function cancelAppointmentAction(id: string): Promise<void> {
  try {
    await apiFetch(`/appointments/${id}/cancel`, { method: 'PATCH' })
    revalidatePath('/minha-conta')
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Erro ao cancelar agendamento')
  }
}
