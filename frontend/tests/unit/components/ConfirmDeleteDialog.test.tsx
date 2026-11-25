import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'

function setup(open = true) {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()
  render(
    <ConfirmDeleteDialog
      open={open}
      title="Usunąć zawodnika?"
      message="Tej operacji nie można cofnąć."
      onConfirm={onConfirm}
      onCancel={onCancel}
    />,
  )
  return { onConfirm, onCancel, user: userEvent.setup() }
}

describe('ConfirmDeleteDialog', () => {
  it('shows the title and message when open', () => {
    setup()

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Usunąć zawodnika?' })).toBeInTheDocument()
    expect(screen.getByText('Tej operacji nie można cofnąć.')).toBeInTheDocument()
  })

  it('renders nothing when closed', () => {
    setup(false)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('confirms with the delete button only', async () => {
    const { user, onConfirm, onCancel } = setup()

    await user.click(screen.getByRole('button', { name: 'Usuń' }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('cancels with the cancel button', async () => {
    const { user, onConfirm, onCancel } = setup()

    await user.click(screen.getByRole('button', { name: 'Anuluj' }))

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('cancels with the Escape key', async () => {
    const { user, onConfirm, onCancel } = setup()

    await user.keyboard('{Escape}')

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })
})
