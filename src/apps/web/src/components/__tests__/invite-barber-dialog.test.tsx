import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const inviteAction = vi.fn()
vi.mock('@/lib/barbers/actions', () => ({
  inviteBarberAction: (...args: unknown[]) => inviteAction(...args),
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}))

import { InviteBarberDialog } from '../invite-barber-dialog'

beforeEach(() => inviteAction.mockReset())

describe('InviteBarberDialog', () => {
  it('invites and shows the temp password when a new account is created', async () => {
    inviteAction.mockResolvedValueOnce({
      id: 'b1',
      user: { email: 'novo@test.com', name: 'Novo' },
      tempPassword: 'abc123xyz789',
    })
    const user = userEvent.setup()
    render(<InviteBarberDialog barbershopId="shop-1" open onOpenChange={() => {}} />)

    await user.type(screen.getByLabelText('Nome'), 'Novo Barbeiro')
    await user.type(screen.getByLabelText('E-mail'), 'novo@test.com')
    await user.click(screen.getByRole('button', { name: /adicionar barbeiro/i }))

    await vi.waitFor(() =>
      expect(inviteAction).toHaveBeenCalledWith(
        'shop-1',
        expect.objectContaining({ name: 'Novo Barbeiro', email: 'novo@test.com' }),
      ),
    )
    expect(await screen.findByText('abc123xyz789')).toBeInTheDocument()
  })

  it('blocks submit and shows a validation error when the name is missing', async () => {
    const user = userEvent.setup()
    render(<InviteBarberDialog barbershopId="shop-1" open onOpenChange={() => {}} />)

    // Valid email passes native input validation so RHF/Zod runs and catches the empty name.
    await user.type(screen.getByLabelText('E-mail'), 'valido@test.com')
    await user.click(screen.getByRole('button', { name: /adicionar barbeiro/i }))

    expect(await screen.findByText('Nome deve ter ao menos 2 caracteres')).toBeInTheDocument()
    expect(inviteAction).not.toHaveBeenCalled()
  })
})
