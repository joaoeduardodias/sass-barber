import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
}))

import Home from '../app/page'

describe('Landing page', () => {
  it('renders the theme toggle button', () => {
    render(<Home />)
    expect(screen.getByRole('button', { name: 'Alternar tema' })).toBeInTheDocument()
  })
})
