import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { TeamSummary } from '@/types/team'
import { makeKit, makeTeam, makeUser } from '../utils/factories'
import { fakeResource } from '../utils/fakeResource'
import { ADMIN, COACH, renderApp } from '../utils/renderApp'

const summary = (overrides: Partial<TeamSummary> = {}): TeamSummary => ({
  ...makeTeam(),
  staffMembers: [],
  ...overrides,
})

const roster = (): TeamSummary[] => [
  summary({
    id: 1,
    name: 'Cracovia',
    countryCode: 'pl',
    league: 'Ekstraklasa',
    staffMembers: [
      makeUser({ id: 'c', fullName: 'Jan Trener', roles: ['Coach'], teamId: 1 }),
      makeUser({ id: 'a', fullName: 'Ola Asystent', roles: ['AssistantCoach'], teamId: 1 }),
      makeUser({ id: 'n', fullName: null, email: 'analityk@test.local', roles: ['Analyst'], teamId: 1 }),
    ],
  }),
  summary({ id: 2, name: 'Wisła', countryCode: null, league: null, staffMembers: [] }),
]

const cardOf = (name: string) => screen.getByText(name).closest('.MuiBox-root')!.parentElement!.parentElement as HTMLElement

function setup(options?: Parameters<typeof fakeResource>[2], initial = roster()) {
  const backend = fakeResource<TeamSummary>('/teams', initial, {
    make: (body, id) => ({ ...body, id, staffMembers: [] }) as unknown as TeamSummary,
    ...options,
  })
  renderApp('/teams', ADMIN)
  return { backend, user: userEvent.setup({ delay: null }) }
}

describe('teams list', () => {
  it('shows every team with its country, league, coach and staff', async () => {
    setup()

    const card = within(cardOf(await screen.findByText('Cracovia').then(() => 'Cracovia')))
    expect(card.getByText('Polska · Ekstraklasa')).toBeInTheDocument()
    expect(card.getByText('Jan Trener')).toBeInTheDocument()
    expect(card.getByText('Ola Asystent (Asystent trenera)')).toBeInTheDocument()
    expect(card.getByText('analityk@test.local (Analityk)')).toBeInTheDocument()
  })

  it('says when a team has no coach and no other staff', async () => {
    setup()
    await screen.findByText('Wisła')

    const card = within(cardOf('Wisła'))
    expect(card.getByText('Brak przypisanego trenera')).toBeInTheDocument()
    expect(card.getByText('Brak')).toBeInTheDocument()
  })

  it('shows an initial when a team has no logo, and the logo when it has one', async () => {
    setup(undefined, [summary({ id: 1, name: 'Cracovia', logoUrl: '/uploads/c.png' }), summary({ id: 2, name: 'Wisła' })])
    await screen.findByText('Wisła')

    expect(cardOf('Cracovia').querySelector('img')).toHaveAttribute('src', 'http://localhost:5006/uploads/c.png')
    expect(within(cardOf('Wisła')).getByText('W')).toBeInTheDocument()
  })

  it('shows an error when the teams cannot be loaded', async () => {
    setup({ failOn: { list: new Response(null, { status: 500 }) } })

    expect(await screen.findByText('Nie udało się pobrać drużyn')).toBeInTheDocument()
  })
})

describe('adding a team', () => {
  async function openDialog(user: ReturnType<typeof userEvent.setup>) {
    await screen.findByText('Cracovia')
    await user.click(screen.getByRole('button', { name: 'Dodaj drużynę' }))
    return screen.getByRole('dialog')
  }

  it('sends the team with default kits and reloads the list', async () => {
    const { user, backend } = setup()
    const dialog = await openDialog(user)

    await user.type(within(dialog).getByLabelText(/Nazwa/), 'Lech Poznań')
    await user.click(within(dialog).getByRole('button', { name: 'Dodaj' }))

    expect(await screen.findByText('Lech Poznań')).toBeInTheDocument()
    expect(backend.created).toEqual([
      {
        name: 'Lech Poznań',
        countryCode: null,
        league: null,
        logoUrl: null,
        homeKit: { pattern: 'Solid', primaryColor: '#7c3aed', secondaryColor: '#ffffff' },
        awayKit: { pattern: 'Solid', primaryColor: '#ffffff', secondaryColor: '#7c3aed' },
        goalkeeperKit: { pattern: 'Solid', primaryColor: '#16a34a', secondaryColor: '#ffffff' },
      },
    ])
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('offers the leagues of the chosen country and clears the league when the country changes', async () => {
    const { user } = setup()
    const dialog = await openDialog(user)
    expect(within(dialog).getByRole('combobox', { name: 'Liga' })).toHaveAttribute('aria-disabled', 'true')
    expect(within(dialog).getByText('Wybierz kraj, aby zobaczyć dostępne ligi.')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('combobox', { name: 'Kraj' }))
    await user.click(screen.getByRole('option', { name: 'Polska' }))
    await user.click(within(dialog).getByRole('combobox', { name: 'Liga' }))
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Brak', 'Ekstraklasa', 'I Liga', 'II Liga', 'III Liga'])
    await user.click(screen.getByRole('option', { name: 'I Liga' }))
    expect(within(dialog).getByRole('combobox', { name: 'Liga' })).toHaveTextContent('I Liga')

    await user.click(within(dialog).getByRole('combobox', { name: 'Kraj' }))
    await user.click(screen.getByRole('option', { name: 'Wielka Brytania' }))

    expect(within(dialog).getByRole('combobox', { name: 'Liga' })).not.toHaveTextContent('I Liga')
  })

  it('sends the chosen country, league and kit colours', async () => {
    const { user, backend } = setup()
    const dialog = await openDialog(user)

    await user.type(within(dialog).getByLabelText(/Nazwa/), 'Lech Poznań')
    await user.click(within(dialog).getByRole('combobox', { name: 'Kraj' }))
    await user.click(screen.getByRole('option', { name: 'Polska' }))
    await user.click(within(dialog).getByRole('combobox', { name: 'Liga' }))
    await user.click(screen.getByRole('option', { name: 'Ekstraklasa' }))
    const homeKit = screen.getByText('Koszulka domowa').parentElement as HTMLElement
    fireEvent.change(within(homeKit).getByLabelText('Kolor 1'), { target: { value: '#ff0000' } })
    await user.click(within(dialog).getByRole('button', { name: 'Dodaj' }))

    await screen.findByText('Lech Poznań')
    expect(backend.created[0]).toMatchObject({
      countryCode: 'pl',
      league: 'Ekstraklasa',
      homeKit: { pattern: 'Solid', primaryColor: '#ff0000' },
    })
  })

  it('lets the home kit use a pattern, but the goalkeeper kit only a colour', async () => {
    const { user } = setup()
    const dialog = await openDialog(user)

    expect(within(dialog).getAllByRole('combobox', { name: 'Wzór' })).toHaveLength(2)
    const goalkeeperKit = screen.getByText('Koszulka bramkarza').parentElement as HTMLElement
    expect(within(goalkeeperKit).queryByRole('combobox', { name: 'Wzór' })).not.toBeInTheDocument()
  })

  it('does not submit without a name', async () => {
    const { user, backend } = setup()
    const dialog = await openDialog(user)

    await user.click(within(dialog).getByRole('button', { name: 'Dodaj' }))

    expect(backend.created).toEqual([])
  })

  it('shows the validation messages of the backend and keeps the form open', async () => {
    const { user } = setup({ failOn: { create: Response.json(['Nieprawidłowy kod kraju.'], { status: 400 }) } })
    const dialog = await openDialog(user)
    await user.type(within(dialog).getByLabelText(/Nazwa/), 'X')

    await user.click(within(dialog).getByRole('button', { name: 'Dodaj' }))

    expect(await within(dialog).findByText('Nieprawidłowy kod kraju.')).toBeInTheDocument()
    expect(within(dialog).getByLabelText(/Nazwa/)).toHaveValue('X')
  })

  it('shows a generic message for other failures', async () => {
    const { user } = setup({ failOn: { create: new Response(null, { status: 500 }) } })
    const dialog = await openDialog(user)
    await user.type(within(dialog).getByLabelText(/Nazwa/), 'X')

    await user.click(within(dialog).getByRole('button', { name: 'Dodaj' }))

    expect(await within(dialog).findByText('Nie udało się utworzyć drużyny.')).toBeInTheDocument()
  })

  it('uploads a logo and sends its url', async () => {
    const { user, backend } = setup()
    const dialog = await openDialog(user)
    await user.type(within(dialog).getByLabelText(/Nazwa/), 'Lech Poznań')

    await user.upload(
      dialog.querySelector('input[type="file"]') as HTMLInputElement,
      new File(['img'], 'logo.png', { type: 'image/png' }),
    )
    await waitFor(() => expect(dialog.querySelector('img')).toHaveAttribute('src', 'http://localhost:5006/uploads/new-photo.png'))
    await user.click(within(dialog).getByRole('button', { name: 'Dodaj' }))

    await screen.findByText('Lech Poznań')
    expect(backend.created[0]).toMatchObject({ logoUrl: '/uploads/new-photo.png' })
  })

  it('reports a failed logo upload', async () => {
    const { user } = setup({ failOn: { upload: new Response(null, { status: 400 }) } })
    const dialog = await openDialog(user)

    await user.upload(
      dialog.querySelector('input[type="file"]') as HTMLInputElement,
      new File(['img'], 'logo.png', { type: 'image/png' }),
    )

    expect(await within(dialog).findByText('Nie udało się wgrać logo.')).toBeInTheDocument()
  })

  it('closes without saving when cancelled', async () => {
    const { user, backend } = setup()
    const dialog = await openDialog(user)

    await user.click(within(dialog).getByRole('button', { name: 'Anuluj' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(backend.created).toEqual([])
  })
})

describe('editing a team', () => {
  it('prefills the form with the team', async () => {
    const { user } = setup(undefined, [
      summary({ id: 1, name: 'Cracovia', countryCode: 'pl', league: 'Ekstraklasa', homeKit: makeKit({ pattern: 'Halves', primaryColor: '#aa0000' }) }),
    ])
    await screen.findByText('Cracovia')

    await user.click(screen.getByRole('button', { name: 'Edytuj' }))

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Edytuj drużynę')).toBeInTheDocument()
    expect(within(dialog).getByLabelText(/Nazwa/)).toHaveValue('Cracovia')
    expect(within(dialog).getByRole('combobox', { name: 'Kraj' })).toHaveValue('Polska')
    expect(within(dialog).getByRole('combobox', { name: 'Liga' })).toHaveTextContent('Ekstraklasa')
    const homeKit = screen.getByText('Koszulka domowa').parentElement as HTMLElement
    expect(within(homeKit).getByRole('combobox', { name: 'Wzór' })).toHaveTextContent('Połówki')
    expect(within(homeKit).getByLabelText('Kolor 1')).toHaveValue('#aa0000')
  })

  it('saves the changes and shows them in the list', async () => {
    const { user, backend } = setup()
    await screen.findByText('Cracovia')

    await user.click(within(cardOf('Cracovia')).getByRole('button', { name: 'Edytuj' }))
    const dialog = screen.getByRole('dialog')
    await user.clear(within(dialog).getByLabelText(/Nazwa/))
    await user.type(within(dialog).getByLabelText(/Nazwa/), 'KS Cracovia')
    await user.click(within(dialog).getByRole('button', { name: 'Zapisz' }))

    expect(await screen.findByText('KS Cracovia')).toBeInTheDocument()
    expect(backend.updated).toHaveLength(1)
    expect(backend.updated[0].id).toBe('1')
    expect(backend.updated[0].body).toMatchObject({
      name: 'KS Cracovia',
      countryCode: 'pl',
      league: 'Ekstraklasa',
      homeKit: expect.objectContaining({ pattern: 'Solid' }),
    })
  })

  it('clears the league when the country is changed', async () => {
    const { user, backend } = setup()
    await screen.findByText('Cracovia')

    await user.click(within(cardOf('Cracovia')).getByRole('button', { name: 'Edytuj' }))
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('combobox', { name: 'Kraj' }))
    await user.click(screen.getByRole('option', { name: 'Wielka Brytania' }))
    await user.click(within(dialog).getByRole('button', { name: 'Zapisz' }))

    await waitFor(() => expect(backend.updated).toHaveLength(1))
    expect(backend.updated[0].body).toMatchObject({ countryCode: 'gb', league: null })
  })

  it('shows an error and keeps the form when saving fails', async () => {
    const { user } = setup({ failOn: { update: new Response(null, { status: 500 }) } })
    await screen.findByText('Cracovia')

    await user.click(within(cardOf('Cracovia')).getByRole('button', { name: 'Edytuj' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Zapisz' }))

    expect(await screen.findByText('Nie udało się zapisać zmian.')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('reports a failed logo upload', async () => {
    const { user } = setup({ failOn: { upload: new Response(null, { status: 400 }) } })
    await screen.findByText('Cracovia')

    await user.click(within(cardOf('Cracovia')).getByRole('button', { name: 'Edytuj' }))
    await user.upload(
      screen.getByRole('dialog').querySelector('input[type="file"]') as HTMLInputElement,
      new File(['img'], 'logo.png', { type: 'image/png' }),
    )

    expect(await screen.findByText('Nie udało się wgrać logo.')).toBeInTheDocument()
  })

  it('discards the changes when cancelled', async () => {
    const { user, backend } = setup()
    await screen.findByText('Cracovia')

    await user.click(within(cardOf('Cracovia')).getByRole('button', { name: 'Edytuj' }))
    await user.clear(within(screen.getByRole('dialog')).getByLabelText(/Nazwa/))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Anuluj' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(backend.updated).toEqual([])
    expect(screen.getByText('Cracovia')).toBeInTheDocument()
  })
})

describe('deleting a team', () => {
  it('warns about everything that will be deleted and deletes after confirmation', async () => {
    const { user, backend } = setup()
    await screen.findByText('Cracovia')

    await user.click(within(cardOf('Wisła')).getByRole('button', { name: 'Usuń' }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Usunąć drużynę?')).toBeInTheDocument()
    expect(within(dialog).getByText(/skasuje też wszystkich jej zawodników, mecze, schematy taktyczne i raporty/)).toBeInTheDocument()
    expect(backend.deleted).toEqual([])

    await user.click(within(dialog).getByRole('button', { name: 'Usuń' }))

    await waitFor(() => expect(screen.queryByText('Wisła')).not.toBeInTheDocument())
    expect(backend.deleted).toEqual(['2'])
    expect(screen.getByText('Cracovia')).toBeInTheDocument()
  })

  it('does not delete when the confirmation is cancelled', async () => {
    const { user, backend } = setup()
    await screen.findByText('Cracovia')
    await user.click(within(cardOf('Wisła')).getByRole('button', { name: 'Usuń' }))

    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Anuluj' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(backend.deleted).toEqual([])
    expect(screen.getByText('Wisła')).toBeInTheDocument()
  })

  it('shows an error when the deletion fails', async () => {
    const { user } = setup({ failOn: { delete: new Response(null, { status: 500 }) } })
    await screen.findByText('Cracovia')
    await user.click(within(cardOf('Wisła')).getByRole('button', { name: 'Usuń' }))

    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Usuń' }))

    expect(await screen.findByText('Nie udało się usunąć drużyny.')).toBeInTheDocument()
    expect(screen.getByText('Wisła')).toBeInTheDocument()
  })
})

describe('access', () => {
  it('is not available to team staff', async () => {
    fakeResource<TeamSummary>('/teams', roster())
    fakeResource('/matches', [])

    renderApp('/teams', COACH)

    expect(await screen.findByText('Zawodnicy', { selector: 'h6' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Dodaj drużynę' })).not.toBeInTheDocument()
  })
})
