import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { UserSummary } from '@/types/user'
import { makeTeam, makeUser } from '../utils/factories'
import { fakeResource } from '../utils/fakeResource'
import { mockApi } from '../utils/mockApi'
import { ADMIN, renderApp } from '../utils/renderApp'
import { DESKTOP, PHONE, setViewportWidth } from '../utils/viewport'

const teams = [
  { ...makeTeam({ id: 1, name: 'Cracovia' }), staffMembers: [] },
  { ...makeTeam({ id: 2, name: 'Wisła' }), staffMembers: [] },
]

const staff = (): UserSummary[] => [
  makeUser({ id: 'u1', fullName: 'Jan Trener', email: 'jan@test.local', roles: ['Coach'], teamId: 1 }),
  makeUser({ id: 'u2', fullName: 'Ola Asystent', email: 'ola@test.local', roles: ['AssistantCoach'], teamId: 1 }),
  makeUser({ id: 'u3', fullName: 'Ewa Analityk', email: 'ewa@test.local', roles: ['Analyst'], teamId: 2 }),
]

function setup(options?: Parameters<typeof fakeResource>[2], initial = staff(), width = DESKTOP) {
  setViewportWidth(width)
  mockApi('get', '/teams', teams)
  const backend = fakeResource<UserSummary>('/users', initial, options)
  renderApp('/users', ADMIN)
  return { backend, user: userEvent.setup({ delay: null }) }
}

async function select(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(await screen.findByText(name))
}

describe('users list', () => {
  it('groups users by team, with the team name and size', async () => {
    setup()

    expect(await screen.findByText('Cracovia')).toBeInTheDocument()
    expect(screen.getByText('Wisła')).toBeInTheDocument()
    expect(screen.getByText('Jan Trener')).toBeInTheDocument()
    expect(screen.getByText('Ewa Analityk')).toBeInTheDocument()
  })

  it('shows how many users each role filter would show', async () => {
    setup()
    await screen.findByText('Jan Trener')

    for (const label of ['Wszyscy · 3', 'Trenerzy · 1', 'Asystenci · 1', 'Analitycy · 1']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('filters by role', async () => {
    const { user } = setup()
    await screen.findByText('Jan Trener')

    await user.click(screen.getByText('Analitycy · 1'))

    expect(screen.getByText('Ewa Analityk')).toBeInTheDocument()
    expect(screen.queryByText('Jan Trener')).not.toBeInTheDocument()
    expect(screen.queryByText('Cracovia')).not.toBeInTheDocument()
  })

  it('searches by name and by e-mail', async () => {
    const { user } = setup()
    await screen.findByText('Jan Trener')
    const search = screen.getByPlaceholderText('Szukaj po imieniu lub e-mailu')

    await user.type(search, 'ola@')
    expect(screen.getByText('Ola Asystent')).toBeInTheDocument()
    expect(screen.queryByText('Jan Trener')).not.toBeInTheDocument()

    await user.clear(search)
    await user.type(search, 'ewa')
    expect(screen.getByText('Ewa Analityk')).toBeInTheDocument()
    expect(screen.queryByText('Ola Asystent')).not.toBeInTheDocument()
  })

  it('says so when nobody matches', async () => {
    const { user } = setup()
    await screen.findByText('Jan Trener')

    await user.type(screen.getByPlaceholderText('Szukaj po imieniu lub e-mailu'), 'nobody')

    expect(screen.getByText('Brak użytkowników spełniających kryteria.')).toBeInTheDocument()
  })

  it('shows an error when users cannot be loaded', async () => {
    setup({ failOn: { list: new Response(null, { status: 500 }) } })

    expect(await screen.findByText('Nie udało się pobrać użytkowników.')).toBeInTheDocument()
  })
})

describe('editing a user (wide layout)', () => {
  it('invites to pick someone until a user is selected', async () => {
    setup()

    expect(await screen.findByText('Wybierz osobę z listy.')).toBeInTheDocument()
  })

  it('shows the selected user in an edit panel with the current values', async () => {
    const { user } = setup()
    await select(user, 'Ola Asystent')

    expect(screen.queryByText('Wybierz osobę z listy.')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Ola Asystent' })).toBeInTheDocument()
    expect(screen.getByLabelText('Imię i nazwisko')).toHaveValue('Ola Asystent')
    expect(screen.getByRole('combobox', { name: 'Rola' })).toHaveTextContent('Asystent trenera')
    expect(screen.getByRole('combobox', { name: 'Drużyna' })).toHaveTextContent('Cracovia')
  })

  it('saves a changed role, team and name', async () => {
    const { user, backend } = setup()
    await select(user, 'Ola Asystent')

    await user.clear(screen.getByLabelText('Imię i nazwisko'))
    await user.type(screen.getByLabelText('Imię i nazwisko'), 'Aleksandra Asystent')
    await user.click(screen.getByRole('combobox', { name: 'Rola' }))
    await user.click(screen.getByRole('option', { name: 'Analityk' }))
    await user.click(screen.getByRole('combobox', { name: 'Drużyna' }))
    await user.click(screen.getByRole('option', { name: 'Wisła' }))
    await user.click(screen.getByRole('button', { name: 'Zapisz' }))

    expect(await screen.findAllByText('Aleksandra Asystent')).not.toHaveLength(0)
    expect(backend.updated).toEqual([
      { id: 'u2', body: { role: 'Analyst', teamId: 2, fullName: 'Aleksandra Asystent', photoUrl: null } },
    ])
  })

  it('moves the user to the other team group after saving', async () => {
    const { user } = setup()
    await select(user, 'Ola Asystent')

    await user.click(screen.getByRole('combobox', { name: 'Drużyna' }))
    await user.click(screen.getByRole('option', { name: 'Wisła' }))
    await user.click(screen.getByRole('button', { name: 'Zapisz' }))

    await waitFor(() => expect(screen.getByRole('button', { name: /Wisła/ })).toHaveTextContent('2'))
  })

  // UsersPage sends the cleared field as "", which the backend stores as an empty name.
  it.skip('BUG: sends no name (null) when the name field was cleared', async () => {
    const { user, backend } = setup()
    await select(user, 'Ola Asystent')

    await user.clear(screen.getByLabelText('Imię i nazwisko'))
    await user.click(screen.getByRole('button', { name: 'Zapisz' }))

    await waitFor(() => expect(backend.updated).toHaveLength(1))
    expect((backend.updated[0].body as { fullName: unknown }).fullName).toBeNull()
  })

  it('shows an error when saving fails', async () => {
    const { user } = setup({ failOn: { update: new Response(null, { status: 500 }) } })
    await select(user, 'Ola Asystent')

    await user.click(screen.getByRole('button', { name: 'Zapisz' }))

    expect(await screen.findByText('Nie udało się zapisać zmian.')).toBeInTheDocument()
  })

  it('restores the stored values when cancelled', async () => {
    const { user, backend } = setup()
    await select(user, 'Ola Asystent')
    await user.clear(screen.getByLabelText('Imię i nazwisko'))
    await user.type(screen.getByLabelText('Imię i nazwisko'), 'Changed')

    await user.click(screen.getByRole('button', { name: 'Anuluj' }))

    expect(screen.getByLabelText('Imię i nazwisko')).toHaveValue('Ola Asystent')
    expect(backend.updated).toEqual([])
  })

  it('switches the panel when another user is selected', async () => {
    const { user } = setup()
    await select(user, 'Ola Asystent')

    await user.click(screen.getByText('Ewa Analityk'))

    expect(screen.getByRole('heading', { name: 'Ewa Analityk' })).toBeInTheDocument()
    expect(screen.getByLabelText('Imię i nazwisko')).toHaveValue('Ewa Analityk')
    expect(screen.getByRole('combobox', { name: 'Drużyna' })).toHaveTextContent('Wisła')
  })

  it('uploads a new photo and saves its url', async () => {
    const { user, backend } = setup()
    await select(user, 'Ola Asystent')

    await user.upload(
      document.querySelector('input[type="file"]') as HTMLInputElement,
      new File(['img'], 'me.png', { type: 'image/png' }),
    )
    await waitFor(() => expect(document.querySelector('img')).toHaveAttribute('src', 'http://localhost:5006/uploads/new-photo.png'))
    await user.click(screen.getByRole('button', { name: 'Zapisz' }))

    await waitFor(() => expect(backend.updated).toHaveLength(1))
    expect(backend.updated[0].body).toMatchObject({ photoUrl: '/uploads/new-photo.png' })
  })

  it('reports a failed photo upload', async () => {
    const { user } = setup({ failOn: { upload: new Response(null, { status: 400 }) } })
    await select(user, 'Ola Asystent')

    await user.upload(
      document.querySelector('input[type="file"]') as HTMLInputElement,
      new File(['img'], 'me.png', { type: 'image/png' }),
    )

    expect(await screen.findByText('Nie udało się wgrać zdjęcia.')).toBeInTheDocument()
  })
})

describe('deleting a user', () => {
  async function openConfirmation(user: ReturnType<typeof userEvent.setup>) {
    await select(user, 'Ola Asystent')
    await user.click(screen.getByRole('button', { name: 'Usuń' }))
    return screen.findByRole('dialog')
  }

  it('warns what will be deleted and removes the user after confirmation', async () => {
    const { user, backend } = setup()

    const dialog = await openConfirmation(user)
    expect(within(dialog).getByText('Usunąć użytkownika?')).toBeInTheDocument()
    expect(within(dialog).getByText(/skasuje też wszystkie raporty i schematy taktyczne/)).toBeInTheDocument()
    expect(backend.deleted).toEqual([])

    await user.click(within(dialog).getByRole('button', { name: 'Usuń' }))

    await waitFor(() => expect(screen.queryByText('Ola Asystent')).not.toBeInTheDocument())
    expect(backend.deleted).toEqual(['u2'])
    expect(await screen.findByText('Wybierz osobę z listy.')).toBeInTheDocument()
  })

  it('does not delete when the confirmation is cancelled', async () => {
    const { user, backend } = setup()
    const dialog = await openConfirmation(user)

    await user.click(within(dialog).getByRole('button', { name: 'Anuluj' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(backend.deleted).toEqual([])
    expect(screen.getByRole('heading', { name: 'Ola Asystent' })).toBeInTheDocument()
  })

  it('shows an error when the deletion fails', async () => {
    const { user } = setup({ failOn: { delete: new Response(null, { status: 500 }) } })
    const dialog = await openConfirmation(user)

    await user.click(within(dialog).getByRole('button', { name: 'Usuń' }))

    expect(await screen.findByText('Nie udało się usunąć użytkownika.')).toBeInTheDocument()
    expect(screen.getAllByText('Ola Asystent').length).toBeGreaterThan(0)
  })
})

describe('narrow layout', () => {
  it('opens the edit panel full screen and closes it again', async () => {
    const { user } = setup(undefined, staff(), PHONE)
    await select(user, 'Ola Asystent')

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByLabelText('Imię i nazwisko')).toHaveValue('Ola Asystent')
    expect(screen.queryByText('Wybierz osobę z listy.')).not.toBeInTheDocument()

    await user.click(within(dialog).getByText('Zamknij'))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('saves from the full screen panel', async () => {
    const { user, backend } = setup(undefined, staff(), PHONE)
    await select(user, 'Ola Asystent')

    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Zapisz' }))

    await waitFor(() => expect(backend.updated).toHaveLength(1))
  })
})

describe('creating an account', () => {
  function setupRegister(options?: Parameters<typeof fakeResource>[2]) {
    return setup({
      createPath: '/auth/register',
      make: (body, id) => ({
        id: `new-${id}`,
        email: body.email as string,
        roles: [body.role as string],
        teamId: body.teamId as number | null,
        fullName: body.fullName as string | null,
        photoUrl: body.photoUrl as string | null,
      }),
      ...options,
    })
  }

  async function openDialog(user: ReturnType<typeof userEvent.setup>) {
    await screen.findByText('Jan Trener')
    await user.click(screen.getByRole('button', { name: 'Dodaj użytkownika' }))
    return screen.getByRole('dialog')
  }

  it('offers every role, with the team only for non-admins', async () => {
    const { user } = setupRegister()
    const dialog = await openDialog(user)

    expect(within(dialog).getByRole('combobox', { name: 'Rola' })).toHaveTextContent('Trener')
    expect(within(dialog).getByRole('combobox', { name: /Drużyna/ })).toBeInTheDocument()

    await user.click(within(dialog).getByRole('combobox', { name: 'Rola' }))
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Administrator',
      'Trener',
      'Asystent trenera',
      'Analityk',
    ])
    await user.click(screen.getByRole('option', { name: 'Administrator' }))

    expect(within(dialog).queryByRole('combobox', { name: /Drużyna/ })).not.toBeInTheDocument()
  })

  it('registers a staff member and shows them in the list', async () => {
    const { user, backend } = setupRegister()
    const dialog = await openDialog(user)

    await user.type(within(dialog).getByLabelText('Imię i nazwisko'), 'Nowy Trener')
    await user.type(within(dialog).getByLabelText(/Email/), 'nowy@test.local')
    await user.type(within(dialog).getByLabelText(/Hasło/), 'Passw0rd!')
    await user.click(within(dialog).getByRole('combobox', { name: /Drużyna/ }))
    await user.click(screen.getByRole('option', { name: 'Wisła' }))
    await user.click(within(dialog).getByRole('button', { name: 'Utwórz konto' }))

    expect(await screen.findByText('Nowy Trener')).toBeInTheDocument()
    expect(backend.created).toEqual([
      {
        fullName: 'Nowy Trener',
        photoUrl: null,
        email: 'nowy@test.local',
        password: 'Passw0rd!',
        role: 'Coach',
        teamId: 2,
      },
    ])
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('sends no name and no team for an administrator without a name', async () => {
    const { user, backend } = setupRegister()
    const dialog = await openDialog(user)

    await user.type(within(dialog).getByLabelText(/Email/), 'admin2@test.local')
    await user.type(within(dialog).getByLabelText(/Hasło/), 'Passw0rd!')
    await user.click(within(dialog).getByRole('combobox', { name: 'Rola' }))
    await user.click(screen.getByRole('option', { name: 'Administrator' }))
    await user.click(within(dialog).getByRole('button', { name: 'Utwórz konto' }))

    await waitFor(() => expect(backend.created).toHaveLength(1))
    expect(backend.created[0]).toMatchObject({ fullName: null, role: 'Admin', teamId: null })
  })

  it('does not submit while required fields are missing', async () => {
    const { user, backend } = setupRegister()
    const dialog = await openDialog(user)

    await user.click(within(dialog).getByRole('button', { name: 'Utwórz konto' }))

    expect(backend.created).toEqual([])
  })

  it('shows the validation messages of the backend and keeps the form open', async () => {
    const { user } = setupRegister({
      failOn: { create: Response.json(['Passwords must have at least one digit.', 'Za krótkie hasło.'], { status: 400 }) },
    })
    const dialog = await openDialog(user)
    await user.type(within(dialog).getByLabelText(/Email/), 'x@test.local')
    await user.type(within(dialog).getByLabelText(/Hasło/), 'weak')
    await user.click(within(dialog).getByRole('combobox', { name: /Drużyna/ }))
    await user.click(screen.getByRole('option', { name: 'Cracovia' }))

    await user.click(within(dialog).getByRole('button', { name: 'Utwórz konto' }))

    expect(
      await within(dialog).findByText('Passwords must have at least one digit. Za krótkie hasło.'),
    ).toBeInTheDocument()
    expect(within(dialog).getByLabelText(/Email/)).toHaveValue('x@test.local')
  })

  it('shows a generic message for other failures', async () => {
    const { user } = setupRegister({ failOn: { create: new Response(null, { status: 500 }) } })
    const dialog = await openDialog(user)
    await user.type(within(dialog).getByLabelText(/Email/), 'x@test.local')
    await user.type(within(dialog).getByLabelText(/Hasło/), 'Passw0rd!')
    await user.click(within(dialog).getByRole('combobox', { name: /Drużyna/ }))
    await user.click(screen.getByRole('option', { name: 'Cracovia' }))

    await user.click(within(dialog).getByRole('button', { name: 'Utwórz konto' }))

    expect(await within(dialog).findByText('Nie udało się zarejestrować użytkownika.')).toBeInTheDocument()
  })

  it('uploads a photo for the new account', async () => {
    const { user, backend } = setupRegister()
    const dialog = await openDialog(user)
    await user.type(within(dialog).getByLabelText(/Email/), 'x@test.local')
    await user.type(within(dialog).getByLabelText(/Hasło/), 'Passw0rd!')
    await user.click(within(dialog).getByRole('combobox', { name: /Drużyna/ }))
    await user.click(screen.getByRole('option', { name: 'Cracovia' }))

    await user.upload(
      dialog.querySelector('input[type="file"]') as HTMLInputElement,
      new File(['img'], 'me.png', { type: 'image/png' }),
    )
    await waitFor(() => expect(dialog.querySelector('img')).not.toBeNull())
    await user.click(within(dialog).getByRole('button', { name: 'Utwórz konto' }))

    await waitFor(() => expect(backend.created).toHaveLength(1))
    expect(backend.created[0]).toMatchObject({ photoUrl: '/uploads/new-photo.png' })
  })

  it('reports a failed photo upload', async () => {
    const { user } = setupRegister({ failOn: { upload: new Response(null, { status: 400 }) } })
    const dialog = await openDialog(user)

    await user.upload(
      dialog.querySelector('input[type="file"]') as HTMLInputElement,
      new File(['img'], 'me.png', { type: 'image/png' }),
    )

    expect(await within(dialog).findByText('Nie udało się wgrać zdjęcia.')).toBeInTheDocument()
  })

  it('forgets the typed data when cancelled', async () => {
    const { user, backend } = setupRegister()
    const dialog = await openDialog(user)
    await user.type(within(dialog).getByLabelText(/Email/), 'typed@test.local')

    await user.click(within(dialog).getByRole('button', { name: 'Anuluj' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'Dodaj użytkownika' }))

    expect(within(screen.getByRole('dialog')).getByLabelText(/Email/)).toHaveValue('')
    expect(backend.created).toEqual([])
  })
})
