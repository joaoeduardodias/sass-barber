import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/appointments/queries', () => ({ listMyAppointments: vi.fn() }))
vi.mock('@/lib/public/queries', () => ({ listPublicServices: vi.fn() }))
vi.mock('@/lib/appointments/actions', () => ({ cancelAppointmentAction: vi.fn() }))

import { listMyAppointments } from '@/lib/appointments/queries'
import { listPublicServices } from '@/lib/public/queries'
import MinhaContaPage from '../app/(customer)/minha-conta/page'

const makeAppointment = (overrides = {}) => ({
  id: 'appt-1',
  customerId: 'user-1',
  barberId: 'barber-1',
  serviceId: 'svc-1',
  barbershopId: 'shop-1',
  scheduledAt: new Date().toISOString(),
  status: 'COMPLETED' as const,
  notes: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  service: { id: 'svc-1', name: 'Degradê', duration: 30, price: 50 },
  barber: { id: 'barber-1', user: { name: 'João' } },
  barbershop: { id: 'shop-1', name: 'Barbearia Alpha', slug: 'alpha' },
  ...overrides,
})

const makeService = (overrides = {}) => ({
  id: 'svc-1',
  name: 'Degradê',
  description: null,
  duration: 30,
  price: 50,
  barbershopId: 'shop-1',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

describe('MinhaContaPage', () => {
  it('shows the services section when user has appointments and services', async () => {
    vi.mocked(listMyAppointments).mockResolvedValue([makeAppointment()])
    vi.mocked(listPublicServices).mockResolvedValue([makeService()])

    render(await MinhaContaPage())

    expect(screen.getByText('Serviços em Barbearia Alpha')).toBeInTheDocument()
    expect(screen.getAllByText('Degradê').length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: 'Agendar' })).toHaveAttribute(
      'href',
      '/b/alpha/agendar',
    )
  })

  it('does not show the services section when user has no appointments', async () => {
    vi.mocked(listMyAppointments).mockResolvedValue([])
    vi.mocked(listPublicServices).mockResolvedValue([])

    render(await MinhaContaPage())

    expect(screen.queryByText(/Serviços em/)).not.toBeInTheDocument()
  })

  it('does not show services section when services list is empty', async () => {
    vi.mocked(listMyAppointments).mockResolvedValue([makeAppointment()])
    vi.mocked(listPublicServices).mockResolvedValue([])

    render(await MinhaContaPage())

    expect(screen.queryByText(/Serviços em/)).not.toBeInTheDocument()
  })
})
