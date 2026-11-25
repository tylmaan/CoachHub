import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserEditPanel } from '@/components/users/UserEditPanel'
import { UserList } from '@/components/users/UserList'
import { UserListFilters } from '@/components/users/UserListFilters'
import type { UserGroup } from '@/types/userDirectory'
import { makeTeam, makeUser } from '../../utils/factories'

describe('UserList', () => {
  const coach = makeUser({ id: 'c1', fullName: 'Jan Nowak', email: 'jan@test.local', roles: ['Coach'], teamId: 1 })
  const analyst = makeUser({ id: 'a1', fullName: null, email: 'ola@test.local', roles: ['Analyst'], teamId: 1 })
  const other = makeUser({ id: 'o1', fullName: 'Ewa Lis', email: 'ewa@test.local', roles: ['AssistantCoach'], teamId: 2 })
  const groups: UserGroup[] = [
    { teamId: 1, teamName: 'Cracovia', users: [coach, analyst] },
    { teamId: 2, teamName: 'Wisła', users: [other] },
  ]

  it('tells when no user matches', () => {
    render(<UserList groups={[]} selectedId={null} onSelect={vi.fn()} />)

    expect(screen.getByText('Brak użytkowników spełniających kryteria.')).toBeInTheDocument()
  })

  it('shows every team with its number of users', () => {
    render(<UserList groups={groups} selectedId={null} onSelect={vi.fn()} />)

    const cracovia = screen.getByText('Cracovia').closest('[role="button"]') as HTMLElement
    expect(within(cracovia).getByText('2')).toBeInTheDocument()
    const wisla = screen.getByText('Wisła').closest('[role="button"]') as HTMLElement
    expect(within(wisla).getByText('1')).toBeInTheDocument()
  })

  it('shows users by name with the e-mail below, or the e-mail alone for unnamed users', () => {
    render(<UserList groups={groups} selectedId={null} onSelect={vi.fn()} />)

    expect(screen.getByText('Jan Nowak')).toBeInTheDocument()
    expect(screen.getByText('jan@test.local')).toBeInTheDocument()
    expect(screen.getAllByText('ola@test.local')).toHaveLength(1)
  })

  it('shows the role in Polish', () => {
    render(<UserList groups={groups} selectedId={null} onSelect={vi.fn()} />)

    expect(screen.getByText('Trener')).toBeInTheDocument()
    expect(screen.getByText('Analityk')).toBeInTheDocument()
    expect(screen.getByText('Asystent trenera')).toBeInTheDocument()
  })

  it('shows initials in the avatar when there is no photo, and the photo when there is one', () => {
    const withPhoto = makeUser({ id: 'p1', fullName: 'Zofia Zet', photoUrl: '/uploads/z.png', teamId: 1 })
    const { container } = render(
      <UserList groups={[{ teamId: 1, teamName: 'Cracovia', users: [coach, withPhoto] }]} selectedId={null} onSelect={vi.fn()} />,
    )

    expect(screen.getByText('JN')).toBeInTheDocument()
    expect(container.querySelector('img')).toHaveAttribute('src', 'http://localhost:5006/uploads/z.png')
  })

  it('selects a user on click', async () => {
    const onSelect = vi.fn()
    render(<UserList groups={groups} selectedId={null} onSelect={onSelect} />)

    await userEvent.setup().click(screen.getByText('Ewa Lis'))

    expect(onSelect).toHaveBeenCalledWith(other)
  })

  it('highlights the selected user only', () => {
    render(<UserList groups={groups} selectedId="c1" onSelect={vi.fn()} />)

    expect(screen.getByText('Jan Nowak').closest('[role="button"]')).toHaveClass('Mui-selected')
    expect(screen.getByText('Ewa Lis').closest('[role="button"]')).not.toHaveClass('Mui-selected')
  })

  it('collapses and expands a team', async () => {
    const user = userEvent.setup()
    render(<UserList groups={groups} selectedId={null} onSelect={vi.fn()} />)

    await user.click(screen.getByText('Cracovia'))
    expect(screen.queryByText('Jan Nowak')).not.toBeInTheDocument()
    expect(screen.getByText('Ewa Lis')).toBeInTheDocument()

    await user.click(screen.getByText('Cracovia'))
    expect(screen.getByText('Jan Nowak')).toBeInTheDocument()
  })

  it('handles the group of users without a team', () => {
    render(
      <UserList
        groups={[{ teamId: null, teamName: 'Bez drużyny', users: [makeUser({ id: 'n1', teamId: null })] }]}
        selectedId={null}
        onSelect={vi.fn()}
      />,
    )

    expect(screen.getByText('Bez drużyny')).toBeInTheDocument()
  })
})

describe('UserListFilters', () => {
  const counts = { ALL: 5, Coach: 2, AssistantCoach: 1, Analyst: 2 }

  function setup(role: 'ALL' | 'Coach' | 'AssistantCoach' | 'Analyst' = 'ALL', query = '') {
    const onQueryChange = vi.fn()
    const onRoleChange = vi.fn()
    render(
      <UserListFilters query={query} onQueryChange={onQueryChange} role={role} onRoleChange={onRoleChange} counts={counts} />,
    )
    return { onQueryChange, onRoleChange, user: userEvent.setup() }
  }

  it('shows the current query', () => {
    setup('ALL', 'nowak')

    expect(screen.getByPlaceholderText('Szukaj po imieniu lub e-mailu')).toHaveValue('nowak')
  })

  it('reports typed text', async () => {
    const { user, onQueryChange } = setup()

    await user.type(screen.getByPlaceholderText('Szukaj po imieniu lub e-mailu'), 'o')

    expect(onQueryChange).toHaveBeenCalledWith('o')
  })

  it('shows a chip with the count for every role filter', () => {
    setup()

    for (const label of ['Wszyscy · 5', 'Trenerzy · 2', 'Asystenci · 1', 'Analitycy · 2']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('reports the chosen role filter', async () => {
    const { user, onRoleChange } = setup()

    await user.click(screen.getByText('Analitycy · 2'))
    await user.click(screen.getByText('Wszyscy · 5'))

    expect(onRoleChange).toHaveBeenNthCalledWith(1, 'Analyst')
    expect(onRoleChange).toHaveBeenNthCalledWith(2, 'ALL')
  })

  it('highlights only the active filter', () => {
    setup('Coach')

    expect(screen.getByText('Trenerzy · 2').closest('.MuiChip-root')).toHaveClass('MuiChip-filled')
    expect(screen.getByText('Wszyscy · 5').closest('.MuiChip-root')).toHaveClass('MuiChip-outlined')
  })
})

describe('UserEditPanel', () => {
  const user = makeUser({ id: 'u1', fullName: 'Jan Nowak', email: 'jan@test.local', roles: ['Coach'], teamId: 1 })
  const teams = [makeTeam({ id: 1, name: 'Cracovia' }), makeTeam({ id: 2, name: 'Wisła' })]

  function setup(overrides: Partial<Parameters<typeof UserEditPanel>[0]> = {}) {
    const handlers = {
      onFullNameChange: vi.fn(),
      onRoleChange: vi.fn(),
      onTeamIdChange: vi.fn(),
      onPhotoSelect: vi.fn(),
      onSave: vi.fn(),
      onCancel: vi.fn(),
      onClose: vi.fn(),
      onDelete: vi.fn(),
    }
    const { container } = render(
      <UserEditPanel
        user={user}
        teams={teams}
        fullName="Jan Nowak"
        role="Coach"
        teamId={1}
        photoUrl={null}
        {...handlers}
        {...overrides}
      />,
    )
    return { ...handlers, container, userEvent: userEvent.setup() }
  }

  it('shows the user being edited', () => {
    setup()

    expect(screen.getByRole('heading', { name: 'Jan Nowak' })).toBeInTheDocument()
    expect(screen.getByText('jan@test.local')).toBeInTheDocument()
  })

  it('shows the current values in the form', () => {
    setup({ fullName: 'Jan Z', role: 'Analyst', teamId: 2 })

    expect(screen.getByLabelText('Imię i nazwisko')).toHaveValue('Jan Z')
    expect(screen.getByRole('combobox', { name: 'Rola' })).toHaveTextContent('Analityk')
    expect(screen.getByRole('combobox', { name: 'Drużyna' })).toHaveTextContent('Wisła')
  })

  it('reports a changed name', () => {
    const { onFullNameChange } = setup()

    fireEvent.change(screen.getByLabelText('Imię i nazwisko'), { target: { value: 'Janusz Nowak' } })

    expect(onFullNameChange).toHaveBeenCalledWith('Janusz Nowak')
  })

  it('offers every role except Admin', async () => {
    const { userEvent: ue } = setup()

    await ue.click(screen.getByRole('combobox', { name: 'Rola' }))

    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Trener', 'Asystent trenera', 'Analityk'])
  })

  it('reports a changed role', async () => {
    const { userEvent: ue, onRoleChange } = setup()

    await ue.click(screen.getByRole('combobox', { name: 'Rola' }))
    await ue.click(screen.getByRole('option', { name: 'Analityk' }))

    expect(onRoleChange).toHaveBeenCalledWith('Analyst')
  })

  it('reports a changed team as a number', async () => {
    const { userEvent: ue, onTeamIdChange } = setup()

    await ue.click(screen.getByRole('combobox', { name: 'Drużyna' }))
    await ue.click(screen.getByRole('option', { name: 'Wisła' }))

    expect(onTeamIdChange).toHaveBeenCalledWith(2)
  })

  it('wires up the save, cancel, close and delete buttons', async () => {
    const { userEvent: ue, onSave, onCancel, onClose, onDelete } = setup()

    await ue.click(screen.getByRole('button', { name: 'Zapisz' }))
    await ue.click(screen.getByRole('button', { name: 'Anuluj' }))
    await ue.click(screen.getByText('Zamknij'))
    await ue.click(screen.getByRole('button', { name: 'Usuń' }))

    expect([onSave, onCancel, onClose, onDelete].map((f) => f.mock.calls.length)).toEqual([1, 1, 1, 1])
  })

  it('accepts a new photo file', () => {
    const { container, onPhotoSelect } = setup()
    const input = container.querySelector('input[type="file"]') as HTMLInputElement

    fireEvent.change(input, { target: { files: [new File(['x'], 'me.png', { type: 'image/png' })] } })

    expect(input).toHaveAttribute('accept', 'image/png,image/jpeg')
    expect(onPhotoSelect).toHaveBeenCalledTimes(1)
  })

  it('shows the photo when there is one, and initials otherwise', () => {
    const { container } = setup({ photoUrl: '/uploads/me.png' })
    expect(container.querySelector('img')).toHaveAttribute('src', 'http://localhost:5006/uploads/me.png')
  })

  it('shows initials without a photo', () => {
    setup()

    expect(screen.getByText('JN')).toBeInTheDocument()
  })
})
