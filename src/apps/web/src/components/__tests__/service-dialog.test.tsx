import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const createAction = vi.fn()
const updateAction = vi.fn()
vi.mock('@/lib/services/actions', () => ({
  createServiceAction: (...args: unknown[]) => createAction(...args),
  updateServiceAction: (...args: unknown[]) => updateAction(...args),
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}))

import { ServiceDialog } from '../service-dialog'

beforeEach(() => {
  createAction.mockReset()
  updateAction.mockReset()
})

describe('ServiceDialog', () => {
  it('blocks submit when the name is empty', async () => {
    const user = userEvent.setup()
    render(<ServiceDialog barbershopId="shop-1" open onOpenChange={() => {}} />)

    await user.click(screen.getByRole('button', { name: /criar serviço/i }))

    expect(await screen.findByText('Nome deve ter ao menos 2 caracteres')).toBeInTheDocument()
    expect(createAction).not.toHaveBeenCalled()
  })

  it('creates a service with coerced numeric values', async () => {
    createAction.mockResolvedValueOnce({})
    const user = userEvent.setup()
    render(<ServiceDialog barbershopId="shop-1" open onOpenChange={() => {}} />)

    await user.type(screen.getByLabelText('Nome'), 'Corte')
    const price = screen.getByLabelText('Preço (R$)')
    await user.clear(price)
    await user.type(price, '40')
    await user.click(screen.getByRole('button', { name: /criar serviço/i }))

    await vi.waitFor(() =>
      expect(createAction).toHaveBeenCalledWith(
        'shop-1',
        expect.objectContaining({ name: 'Corte', price: 40, duration: 30 }),
      ),
    )
  })
})
