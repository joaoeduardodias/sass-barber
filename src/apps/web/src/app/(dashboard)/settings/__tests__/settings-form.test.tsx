import type { Barbershop } from '@barber/types'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const updateAction = vi.fn()
vi.mock('@/lib/barbershops/actions', () => ({
  updateBarbershopAction: (...args: unknown[]) => updateAction(...args),
}))

import { SettingsForm } from '../settings-form'

const shop: Barbershop = {
  id: 'shop-1',
  name: 'Barbearia Teste',
  slug: 'barbearia-teste',
  description: null,
  address: 'Rua Teste, 123',
  phone: '11999999999',
  logoUrl: null,
  ownerId: 'owner-1',
  isActive: true,
  createdAt: '',
  updatedAt: '',
}

beforeEach(() => updateAction.mockReset())

describe('SettingsForm', () => {
  it('blocks submit and shows an error for an invalid slug', async () => {
    const user = userEvent.setup()
    render(<SettingsForm shop={shop} />)

    const slug = screen.getByLabelText('Slug (URL pública)')
    await user.clear(slug)
    await user.type(slug, 'Com Espaco Invalido')
    await user.click(screen.getByRole('button', { name: /salvar/i }))

    expect(await screen.findByText('Slug inválido')).toBeInTheDocument()
    expect(updateAction).not.toHaveBeenCalled()
  })

  it('submits valid changes', async () => {
    updateAction.mockResolvedValueOnce(shop)
    const user = userEvent.setup()
    render(<SettingsForm shop={shop} />)

    const name = screen.getByLabelText('Nome')
    await user.clear(name)
    await user.type(name, 'Novo Nome')
    await user.click(screen.getByRole('button', { name: /salvar/i }))

    await vi.waitFor(() =>
      expect(updateAction).toHaveBeenCalledWith(
        'shop-1',
        expect.objectContaining({ name: 'Novo Nome' }),
      ),
    )
  })
})
