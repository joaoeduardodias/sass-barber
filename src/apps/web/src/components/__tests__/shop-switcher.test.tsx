import type { Barbershop } from '@barber/types'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const setActive = vi.fn()
vi.mock('@/lib/barbershops/actions', () => ({
  setActiveBarbershopAction: (...args: unknown[]) => setActive(...args),
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}))

import { ShopSwitcher } from '../shop-switcher'

function makeShop(id: string, name: string): Barbershop {
  return {
    id,
    name,
    slug: name.toLowerCase(),
    description: null,
    address: 'a',
    phone: 'p',
    logoUrl: null,
    ownerId: 'o',
    isActive: true,
    createdAt: '',
    updatedAt: '',
  }
}

beforeEach(() => {
  setActive.mockReset()
  document.cookie = 'active-barbershop=shop-1'
})

describe('ShopSwitcher', () => {
  it('shows the active shop and switches on select', async () => {
    const user = userEvent.setup()
    render(
      <ShopSwitcher
        shops={[makeShop('shop-1', 'Alpha'), makeShop('shop-2', 'Beta')]}
        activeId="shop-1"
      />,
    )

    const trigger = screen.getByRole('button', { name: /trocar de barbearia/i })
    expect(trigger).toHaveTextContent('Alpha')

    await user.click(trigger)
    await user.click(await screen.findByText('Beta'))

    expect(setActive).toHaveBeenCalledWith('shop-2')
  })
})
