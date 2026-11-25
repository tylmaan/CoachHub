import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { KitEditor } from '@/components/KitEditor'
import { makeKit } from '../../utils/factories'

function setup(kit = makeKit(), solidOnly = false) {
  const onChange = vi.fn()
  const { container } = render(<KitEditor label="Strój domowy" kit={kit} onChange={onChange} solidOnly={solidOnly} />)
  return { onChange, container, user: userEvent.setup() }
}

describe('KitEditor', () => {
  it('shows its label and a preview shirt with the number 10', () => {
    const { container } = setup()

    expect(screen.getByText('Strój domowy')).toBeInTheDocument()
    expect(container.querySelector('svg text')).toHaveTextContent('10')
  })

  it('shows the current pattern and primary colour', () => {
    setup(makeKit({ pattern: 'Halves', primaryColor: '#abcdef' }))

    expect(screen.getByRole('combobox', { name: 'Wzór' })).toHaveTextContent('Połówki')
    expect(screen.getByLabelText('Kolor 1')).toHaveValue('#abcdef')
  })

  it('hides the second colour for a solid kit', () => {
    setup(makeKit({ pattern: 'Solid' }))

    expect(screen.queryByLabelText('Kolor 2')).not.toBeInTheDocument()
  })

  it('shows the second colour for patterned kits', () => {
    setup(makeKit({ pattern: 'Sash', secondaryColor: '#123456' }))

    expect(screen.getByLabelText('Kolor 2')).toHaveValue('#123456')
  })

  it('offers only one colour and no pattern in solid-only mode', () => {
    setup(makeKit({ pattern: 'Halves' }), true)

    expect(screen.queryByRole('combobox', { name: 'Wzór' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Kolor 2')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Kolor 1')).toBeInTheDocument()
  })

  it('reports a changed primary colour, keeping the rest of the kit', () => {
    const kit = makeKit({ pattern: 'Sash', primaryColor: '#111111', secondaryColor: '#222222' })
    const { onChange } = setup(kit)

    fireEvent.change(screen.getByLabelText('Kolor 1'), { target: { value: '#ff0000' } })

    expect(onChange).toHaveBeenCalledWith({ pattern: 'Sash', primaryColor: '#ff0000', secondaryColor: '#222222' })
  })

  it('reports a changed secondary colour, keeping the rest of the kit', () => {
    const kit = makeKit({ pattern: 'Sash', primaryColor: '#111111', secondaryColor: '#222222' })
    const { onChange } = setup(kit)

    fireEvent.change(screen.getByLabelText('Kolor 2'), { target: { value: '#00ff00' } })

    expect(onChange).toHaveBeenCalledWith({ pattern: 'Sash', primaryColor: '#111111', secondaryColor: '#00ff00' })
  })

  it('reports a changed pattern', async () => {
    const kit = makeKit({ pattern: 'Solid' })
    const { onChange, user } = setup(kit)

    await user.click(screen.getByRole('combobox', { name: 'Wzór' }))
    await user.click(screen.getByRole('option', { name: 'Szarfa' }))

    expect(onChange).toHaveBeenCalledWith({ ...kit, pattern: 'Sash' })
  })

  it('lists every pattern with its Polish label', async () => {
    const { user } = setup()

    await user.click(screen.getByRole('combobox', { name: 'Wzór' }))

    const options = screen.getAllByRole('option').map((o) => o.textContent)
    expect(options).toEqual(['Jednolita', 'Paski pionowe', 'Paski poziome', 'Połówki', 'Szarfa', 'Ćwiartki'])
  })
})
