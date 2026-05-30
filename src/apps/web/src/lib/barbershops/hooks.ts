'use client'

import { apiClient } from '@/lib/api/client'
import type { Barbershop } from '@barber/types'
import { useQuery } from '@tanstack/react-query'

export function useBarbershops() {
  return useQuery({
    queryKey: ['barbershops'],
    queryFn: () => apiClient<Barbershop[]>('/barbershops'),
  })
}
