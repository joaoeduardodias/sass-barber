import { Button, Input } from '@barber/ui'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

describe('ui smoke', () => {
  it('renders Button and Input from @barber/ui', () => {
    render(
      <>
        <Button>Salvar</Button>
        <Input aria-label="campo" defaultValue="x" />
      </>,
    )
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument()
    expect(screen.getByLabelText('campo')).toHaveValue('x')
  })
})
