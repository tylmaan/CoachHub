import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Match } from '@/types/match'
import { makeMatch, makeTeam } from '../utils/factories'
import { fakeResource } from '../utils/fakeResource'
import { mockApi } from '../utils/mockApi'
import { ANALYST, ASSISTANT, COACH, renderApp } from '../utils/renderApp'

const isoDay = (offset: number) => {
  const d = new Date(2025, 5, 15 + offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const played = (overrides: Partial<Match>) =>
  makeMatch({ status: 'Played', scoreFor: 1, scoreAgainst: 0, ...overrides })

const roster = (): Match[] => [
  played({ id: 1, opponent: 'Alpha', date: '2025-09-10', season: '2025/26', scoreFor: 2, scoreAgainst: 1, isHome: true, matchType: 'League', round: '5' }),
  played({ id: 2, opponent: 'Beta', date: '2025-09-20', season: '2025/26', scoreFor: 0, scoreAgainst: 3, isHome: false, matchType: 'Cup', competition: 'Puchar Polski', round: 'Półfinał' }),
  played({ id: 3, opponent: 'Gamma', date: '2025-08-01', season: '2025/26', scoreFor: 1, scoreAgainst: 1, isHome: null, matchType: 'Friendly', round: null }),
  played({ id: 4, opponent: 'Old Rival', date: '2024-09-10', season: '2024/25', scoreFor: 3, scoreAgainst: 0 }),
  makeMatch({ id: 5, opponent: 'Delta', date: isoDay(3), season: '2025/26', status: 'Planned' }),
  makeMatch({ id: 6, opponent: 'Epsilon', date: isoDay(1), season: '2025/26', status: 'Planned', isHome: false }),
]

const opponents = () =>
  screen
    .getAllByText(/^(Alpha|Beta|Gamma|Delta|Epsilon|Zeta|Old Rival|Eta)$/)
    .map((el) => el.textContent)

const rowOf = (name: string) => screen.getByText(name).parentElement!.parentElement!.parentElement as HTMLElement

function setup(auth = COACH, initial = roster(), options?: Parameters<typeof fakeResource>[2]) {
  mockApi('get', '/teams', [{ ...makeTeam({ id: 1, countryCode: 'pl', league: 'Ekstraklasa' }), staffMembers: [] }])
  const backend = fakeResource<Match>('/matches', initial, {
    make: (body, id) => ({ ...body, id, gamePlan: null, opponentNotes: null }) as unknown as Match,
    ...options,
  })
  renderApp('/matches', auth)
  return { backend, user: userEvent.setup({ delay: null }) }
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2025, 5, 15, 10, 0))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('matches list', () => {
  it('opens on the results of the latest season, newest first', async () => {
    setup()

    expect(await screen.findByText('Alpha')).toBeInTheDocument()
    expect(opponents()).toEqual(['Beta', 'Alpha', 'Gamma'])
    expect(screen.queryByText('Old Rival')).not.toBeInTheDocument()
  })

  it('shows the tab counts for the selected season', async () => {
    setup()
    await screen.findByText('Alpha')

    expect(screen.getByRole('button', { name: 'Wyniki (3)' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Zaplanowane (2)' })).toBeInTheDocument()
  })

  it('shows the score, the venue, the type and the round of each match', async () => {
    setup()
    await screen.findByText('Alpha')

    const alpha = within(rowOf('Alpha'))
    expect(alpha.getByText('2 : 1')).toBeInTheDocument()
    expect(alpha.getByText(/2025-09-10 · Dom/)).toBeInTheDocument()
    expect(alpha.getByText('Ekstraklasa')).toBeInTheDocument()
    expect(alpha.getByText('5')).toBeInTheDocument()

    const beta = within(rowOf('Beta'))
    expect(beta.getByText('0 : 3')).toBeInTheDocument()
    expect(beta.getByText(/· Wyjazd/)).toBeInTheDocument()
    expect(beta.getByText('Puchar Polski')).toBeInTheDocument()
    expect(beta.getByText('Półfinał')).toBeInTheDocument()

    const gamma = within(rowOf('Gamma'))
    expect(gamma.getByText('1 : 1')).toBeInTheDocument()
    expect(gamma.getByText('Towarzyski')).toBeInTheDocument()
    expect(gamma.queryByText(/Dom|Wyjazd/)).not.toBeInTheDocument()
  })

  it('shows the opponent logo, or its initial', async () => {
    setup(COACH, [played({ id: 1, opponent: 'Alpha', opponentLogoUrl: '/uploads/a.png' }), played({ id: 2, opponent: 'Beta' })])
    await screen.findByText('Alpha')

    expect(rowOf('Alpha').querySelector('img')).toHaveAttribute('src', 'http://localhost:5006/uploads/a.png')
    expect(within(rowOf('Beta')).getByText('B')).toBeInTheDocument()
  })

  it('lists planned matches soonest first with a countdown', async () => {
    const { user } = setup()
    await screen.findByText('Alpha')

    await user.click(screen.getByRole('button', { name: 'Zaplanowane (2)' }))

    expect(opponents()).toEqual(['Epsilon', 'Delta'])
    expect(within(rowOf('Epsilon')).getByText('jutro')).toBeInTheDocument()
    expect(within(rowOf('Delta')).getByText('za 3 dni')).toBeInTheDocument()
  })

  it('says so when there are no matches in a tab', async () => {
    const { user } = setup(COACH, [played({ id: 1, opponent: 'Alpha' })])
    await screen.findByText('Alpha')

    await user.click(screen.getByRole('button', { name: 'Zaplanowane (0)' }))
    expect(screen.getByText('Brak zaplanowanych meczów.')).toBeInTheDocument()
  })

  it('says so when there are no results yet', async () => {
    setup(COACH, [makeMatch({ id: 1, opponent: 'Delta', date: isoDay(2) })])

    expect(await screen.findByText('Brak rozegranych meczów.')).toBeInTheDocument()
  })

  it('switches between seasons, newest first in the selector', async () => {
    const { user } = setup()
    await screen.findByText('Alpha')

    await user.click(screen.getByRole('combobox', { name: 'Sezon' }))
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['2025/26', '2024/25'])
    await user.click(screen.getByRole('option', { name: '2024/25' }))

    expect(opponents()).toEqual(['Old Rival'])
    expect(screen.getByRole('button', { name: 'Wyniki (1)' })).toBeInTheDocument()
  })

  it('remembers the tab and the season while the session lasts', async () => {
    const { user } = setup()
    await screen.findByText('Alpha')

    await user.click(screen.getByRole('combobox', { name: 'Sezon' }))
    await user.click(screen.getByRole('option', { name: '2024/25' }))
    await user.click(screen.getByRole('button', { name: /Zaplanowane/ }))

    expect(sessionStorage.getItem('matches.tab')).toBe('"Planned"')
    expect(sessionStorage.getItem('matches.season')).toBe('"2024/25"')
  })

  it('falls back to the latest season when the remembered one has no matches', async () => {
    sessionStorage.setItem('matches.season', '"1999/00"')
    setup()

    expect(await screen.findByText('Alpha')).toBeInTheDocument()
  })

  it('shows an error when the matches cannot be loaded', async () => {
    setup(COACH, roster(), { failOn: { list: new Response(null, { status: 500 }) } })

    expect(await screen.findByText('Nie udało się pobrać meczów.')).toBeInTheDocument()
  })

  it('still works when the team cannot be loaded', async () => {
    setup()
    expect(await screen.findByText('Alpha')).toBeInTheDocument()
  })
})

describe('permissions', () => {
  it('lets a coach add, finish, edit and delete matches', async () => {
    const { user } = setup()
    await screen.findByText('Alpha')

    expect(screen.getByRole('button', { name: 'Dodaj mecz' })).toBeInTheDocument()
    const alpha = within(rowOf('Alpha'))
    expect(alpha.getByText('Edytuj')).toBeInTheDocument()
    expect(alpha.getByText('Usuń')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Zaplanowane (2)' }))
    expect(within(rowOf('Delta')).getByText('Zakończ mecz')).toBeInTheDocument()
  })

  it('lets an assistant edit and finish matches, but not delete them', async () => {
    setup(ASSISTANT)
    await screen.findByText('Alpha')

    expect(screen.getByRole('button', { name: 'Dodaj mecz' })).toBeInTheDocument()
    const alpha = within(rowOf('Alpha'))
    expect(alpha.getByText('Edytuj')).toBeInTheDocument()
    expect(alpha.queryByText('Usuń')).not.toBeInTheDocument()
  })

  it('lets an analyst only look at matches', async () => {
    setup(ANALYST)
    await screen.findByText('Alpha')

    expect(screen.queryByRole('button', { name: 'Dodaj mecz' })).not.toBeInTheDocument()
    const alpha = within(rowOf('Alpha'))
    expect(alpha.getByText('Szczegóły')).toBeInTheDocument()
    expect(alpha.queryByText('Edytuj')).not.toBeInTheDocument()
    expect(alpha.queryByText('Usuń')).not.toBeInTheDocument()
  })
})

describe('adding a match', () => {
  async function openCreate(user: ReturnType<typeof userEvent.setup>, planned = false) {
    await screen.findByText('Alpha')
    if (planned) await user.click(screen.getByRole('button', { name: 'Zaplanowane (2)' }))
    await user.click(screen.getByRole('button', { name: planned ? 'Zaplanuj mecz' : 'Dodaj mecz' }))
    return screen.getByRole('dialog')
  }

  async function fillBasics(user: ReturnType<typeof userEvent.setup>, dialog: HTMLElement) {
    fireEvent.change(within(dialog).getByLabelText(/Data/), { target: { value: '2025-10-04' } })
    await user.type(within(dialog).getByLabelText(/Przeciwnik/), 'Zeta')
    await user.type(within(dialog).getByLabelText(/Sezon/), '2026/27')
  }

  it('creates a played match with its score and selects the new season', async () => {
    const { user, backend } = setup()
    const dialog = await openCreate(user)

    expect(within(dialog).getByText('Nowy mecz')).toBeInTheDocument()
    await fillBasics(user, dialog)
    await user.type(within(dialog).getByLabelText('Bramki strzelone'), '3')
    await user.type(within(dialog).getByLabelText('Bramki stracone'), '2')
    await user.click(within(dialog).getByRole('combobox', { name: 'Dom/Wyjazd' }))
    await user.click(screen.getByRole('option', { name: 'Dom' }))
    await user.click(within(dialog).getByRole('button', { name: 'Dodaj' }))

    expect(await screen.findByText('Zeta')).toBeInTheDocument()
    expect(backend.created).toEqual([
      {
        status: 'Played',
        date: '2025-10-04',
        opponent: 'Zeta',
        season: '2026/27',
        teamId: 1,
        scoreFor: 3,
        scoreAgainst: 2,
        isHome: true,
        matchType: null,
        competition: null,
        round: null,
        formation: null,
        opponentLogoUrl: null,
      },
    ])
    expect(opponents()).toEqual(['Zeta'])
    expect(sessionStorage.getItem('matches.season')).toBe('"2026/27"')
  })

  it('plans a match without a score from the planned tab', async () => {
    const { user, backend } = setup()
    const dialog = await openCreate(user, true)

    expect(within(dialog).getByText('Zaplanuj mecz')).toBeInTheDocument()
    expect(within(dialog).queryByLabelText('Bramki strzelone')).not.toBeInTheDocument()
    await fillBasics(user, dialog)
    await user.click(within(dialog).getByRole('button', { name: 'Dodaj' }))

    await waitFor(() => expect(backend.created).toHaveLength(1))
    expect(backend.created[0]).toMatchObject({ status: 'Planned', scoreFor: null, scoreAgainst: null, opponent: 'Zeta' })
  })

  it('asks for the round only for league and cup matches', async () => {
    const { user } = setup()
    const dialog = await openCreate(user)
    expect(within(dialog).queryByLabelText('Kolejka / Runda')).not.toBeInTheDocument()

    await user.click(within(dialog).getByRole('combobox', { name: 'Typ meczu' }))
    await user.click(screen.getByRole('option', { name: 'Ligowy' }))
    expect(within(dialog).getByLabelText('Kolejka / Runda')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('combobox', { name: 'Typ meczu' }))
    await user.click(screen.getByRole('option', { name: 'Towarzyski' }))
    expect(within(dialog).queryByLabelText('Kolejka / Runda')).not.toBeInTheDocument()
  })

  it('sends the round of a league match', async () => {
    const { user, backend } = setup()
    const dialog = await openCreate(user)
    await fillBasics(user, dialog)

    await user.click(within(dialog).getByRole('combobox', { name: 'Typ meczu' }))
    await user.click(screen.getByRole('option', { name: 'Ligowy' }))
    await user.type(within(dialog).getByLabelText('Kolejka / Runda'), '12')
    await user.click(within(dialog).getByRole('button', { name: 'Dodaj' }))

    await waitFor(() => expect(backend.created).toHaveLength(1))
    expect(backend.created[0]).toMatchObject({ matchType: 'League', competition: null, round: '12' })
  })

  it('offers the cup competitions of the team country and the international ones, and sends the chosen one', async () => {
    const { user, backend } = setup()
    const dialog = await openCreate(user)
    await fillBasics(user, dialog)

    await user.click(within(dialog).getByRole('combobox', { name: 'Typ meczu' }))
    await user.click(screen.getByRole('option', { name: 'Pucharowy' }))
    await user.click(within(dialog).getByRole('combobox', { name: 'Rozgrywki pucharowe' }))
    const options = screen.getAllByRole('option').map((o) => o.textContent)
    expect(options).toEqual([
      '--',
      'Polska',
      'Puchar Polski',
      'Superpuchar Polski',
      'Międzynarodowe',
      'Liga Mistrzów',
      'Liga Europy',
      'Liga Konferencji Europy',
    ])
    await user.click(screen.getByRole('option', { name: 'Liga Mistrzów' }))
    await user.click(within(dialog).getByRole('button', { name: 'Dodaj' }))

    await waitFor(() => expect(backend.created).toHaveLength(1))
    expect(backend.created[0]).toMatchObject({ matchType: 'Cup', competition: 'Liga Mistrzów' })
  })

  it('does not submit while required fields are empty', async () => {
    const { user, backend } = setup()
    const dialog = await openCreate(user)

    await user.click(within(dialog).getByRole('button', { name: 'Dodaj' }))

    expect(backend.created).toEqual([])
  })

  it('shows the validation messages of the backend and keeps the form', async () => {
    const { user } = setup(COACH, roster(), {
      failOn: { create: Response.json(['Rozegrany mecz musi mieć podany wynik.'], { status: 400 }) },
    })
    const dialog = await openCreate(user)
    await fillBasics(user, dialog)

    await user.click(within(dialog).getByRole('button', { name: 'Dodaj' }))

    expect(await within(dialog).findByText('Rozegrany mecz musi mieć podany wynik.')).toBeInTheDocument()
    expect(within(dialog).getByLabelText(/Przeciwnik/)).toHaveValue('Zeta')
  })

  it('shows a generic message for other failures', async () => {
    const { user } = setup(COACH, roster(), { failOn: { create: new Response(null, { status: 500 }) } })
    const dialog = await openCreate(user)
    await fillBasics(user, dialog)

    await user.click(within(dialog).getByRole('button', { name: 'Dodaj' }))

    expect(await within(dialog).findByText('Nie udało się utworzyć meczu.')).toBeInTheDocument()
  })

  it('uploads the logo of the opponent and sends its url', async () => {
    const { user, backend } = setup()
    const dialog = await openCreate(user)
    await fillBasics(user, dialog)

    await user.upload(
      dialog.querySelector('input[type="file"]') as HTMLInputElement,
      new File(['img'], 'logo.png', { type: 'image/png' }),
    )
    await waitFor(() => expect(dialog.querySelector('img')).not.toBeNull())
    await user.click(within(dialog).getByRole('button', { name: 'Dodaj' }))

    await waitFor(() => expect(backend.created).toHaveLength(1))
    expect(backend.created[0]).toMatchObject({ opponentLogoUrl: '/uploads/new-photo.png' })
  })

  it('reports a failed logo upload', async () => {
    const { user } = setup(COACH, roster(), { failOn: { upload: new Response(null, { status: 400 }) } })
    const dialog = await openCreate(user)

    await user.upload(
      dialog.querySelector('input[type="file"]') as HTMLInputElement,
      new File(['img'], 'logo.png', { type: 'image/png' }),
    )

    expect(await within(dialog).findByText('Nie udało się przesłać pliku.')).toBeInTheDocument()
  })
})

describe('editing a match', () => {
  it('prefills the form, with the score only for played matches', async () => {
    const { user } = setup()
    await screen.findByText('Alpha')

    await user.click(within(rowOf('Alpha')).getByText('Edytuj'))

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Edytuj mecz')).toBeInTheDocument()
    expect(within(dialog).getByLabelText(/Data/)).toHaveValue('2025-09-10')
    expect(within(dialog).getByLabelText(/Przeciwnik/)).toHaveValue('Alpha')
    expect(within(dialog).getByLabelText(/Sezon/)).toHaveValue('2025/26')
    expect(within(dialog).getByLabelText('Bramki strzelone')).toHaveValue('2')
    expect(within(dialog).getByLabelText('Bramki stracone')).toHaveValue('1')
    expect(within(dialog).getByRole('combobox', { name: 'Dom/Wyjazd' })).toHaveTextContent('Dom')
    expect(within(dialog).getByRole('combobox', { name: 'Typ meczu' })).toHaveTextContent('Ligowy')
    expect(within(dialog).getByLabelText('Kolejka / Runda')).toHaveValue('5')
  })

  it('hides the score when editing a planned match', async () => {
    const { user } = setup()
    await screen.findByText('Alpha')
    await user.click(screen.getByRole('button', { name: 'Zaplanowane (2)' }))

    await user.click(within(rowOf('Delta')).getByText('Edytuj'))

    expect(within(screen.getByRole('dialog')).queryByLabelText('Bramki strzelone')).not.toBeInTheDocument()
  })

  it('saves the changes, keeping the status and the formation', async () => {
    const { user, backend } = setup(COACH, [played({ id: 1, opponent: 'Alpha', formation: '442' })])
    await screen.findByText('Alpha')

    await user.click(within(rowOf('Alpha')).getByText('Edytuj'))
    const dialog = screen.getByRole('dialog')
    await user.clear(within(dialog).getByLabelText(/Przeciwnik/))
    await user.type(within(dialog).getByLabelText(/Przeciwnik/), 'Alpha United')
    await user.click(within(dialog).getByRole('button', { name: 'Zapisz' }))

    expect(await screen.findByText('Alpha United')).toBeInTheDocument()
    expect(backend.updated[0].body).toMatchObject({
      status: 'Played',
      opponent: 'Alpha United',
      formation: '442',
      teamId: 1,
      scoreFor: 1,
      scoreAgainst: 0,
    })
  })

  it('drops the competition when the type is changed away from cup', async () => {
    const { user, backend } = setup()
    await screen.findByText('Alpha')

    await user.click(within(rowOf('Beta')).getByText('Edytuj'))
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('combobox', { name: 'Typ meczu' }))
    await user.click(screen.getByRole('option', { name: 'Towarzyski' }))
    await user.click(within(dialog).getByRole('button', { name: 'Zapisz' }))

    await waitFor(() => expect(backend.updated).toHaveLength(1))
    expect(backend.updated[0].body).toMatchObject({ matchType: 'Friendly', competition: null })
  })

  it('shows an error when saving fails', async () => {
    const { user } = setup(COACH, roster(), { failOn: { update: new Response(null, { status: 500 }) } })
    await screen.findByText('Alpha')

    await user.click(within(rowOf('Alpha')).getByText('Edytuj'))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Zapisz' }))

    expect(await screen.findByText('Nie udało się zaktualizować meczu.')).toBeInTheDocument()
  })

  it('discards the changes when cancelled', async () => {
    const { user, backend } = setup()
    await screen.findByText('Alpha')

    await user.click(within(rowOf('Alpha')).getByText('Edytuj'))
    await user.clear(within(screen.getByRole('dialog')).getByLabelText(/Przeciwnik/))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Anuluj' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(backend.updated).toEqual([])
  })
})

describe('finishing a match', () => {
  async function openFinish(user: ReturnType<typeof userEvent.setup>) {
    await screen.findByText('Alpha')
    await user.click(screen.getByRole('button', { name: 'Zaplanowane (2)' }))
    await user.click(within(rowOf('Delta')).getByText('Zakończ mecz'))
    return screen.getByRole('dialog')
  }

  function mockDetailPage(id: number) {
    mockApi('get', `/matches/${id}`, makeMatch({ id, opponent: 'Delta', status: 'Played', scoreFor: 2, scoreAgainst: 0 }))
    mockApi('get', `/matchappearances/match/${id}`, [])
    mockApi('get', `/matchevents/match/${id}`, [])
    mockApi('get', '/players', [])
    mockApi('get', `/tacticalschemes/match/${id}`, [])
  }

  it('saves the result as a played match and opens its page', async () => {
    const { user, backend } = setup()
    mockDetailPage(5)
    const dialog = await openFinish(user)
    expect(within(dialog).getByText('Zakończ mecz: Delta')).toBeInTheDocument()

    await user.type(within(dialog).getByLabelText('Bramki strzelone'), '2')
    await user.type(within(dialog).getByLabelText('Bramki stracone'), '0')
    await user.click(within(dialog).getByRole('button', { name: 'Zapisz wynik' }))

    await waitFor(() => expect(screen.getByLabelText('Wróć')).toHaveAttribute('href', '/matches'))
    expect(backend.updated).toHaveLength(1)
    expect(backend.updated[0].id).toBe('5')
    expect(backend.updated[0].body).toMatchObject({ status: 'Played', scoreFor: 2, scoreAgainst: 0, opponent: 'Delta' })
  })

  it('accepts a goalless draw', async () => {
    const { user, backend } = setup()
    mockDetailPage(5)
    const dialog = await openFinish(user)

    await user.type(within(dialog).getByLabelText('Bramki strzelone'), '0')
    await user.type(within(dialog).getByLabelText('Bramki stracone'), '0')
    await user.click(within(dialog).getByRole('button', { name: 'Zapisz wynik' }))

    await waitFor(() => expect(backend.updated).toHaveLength(1))
    expect(backend.updated[0].body).toMatchObject({ scoreFor: 0, scoreAgainst: 0 })
  })

  it.each([
    ['both scores missing', '', ''],
    ['one score missing', '2', ''],
    ['a negative score', '-1', '0'],
  ])('asks for the result when %s', async (_name, goalsFor, goalsAgainst) => {
    const { user, backend } = setup()
    const dialog = await openFinish(user)

    if (goalsFor) await user.type(within(dialog).getByLabelText('Bramki strzelone'), goalsFor)
    if (goalsAgainst) await user.type(within(dialog).getByLabelText('Bramki stracone'), goalsAgainst)
    await user.click(within(dialog).getByRole('button', { name: 'Zapisz wynik' }))

    expect(within(dialog).getByText('Podaj wynik meczu.')).toBeInTheDocument()
    expect(backend.updated).toEqual([])
  })

  it('shows an error and keeps the dialog when saving fails', async () => {
    const { user } = setup(COACH, roster(), { failOn: { update: new Response(null, { status: 500 }) } })
    const dialog = await openFinish(user)

    await user.type(within(dialog).getByLabelText('Bramki strzelone'), '1')
    await user.type(within(dialog).getByLabelText('Bramki stracone'), '1')
    await user.click(within(dialog).getByRole('button', { name: 'Zapisz wynik' }))

    expect(await within(dialog).findByText('Nie udało się zakończyć meczu.')).toBeInTheDocument()
  })

  it('starts with empty fields every time', async () => {
    const { user } = setup()
    const dialog = await openFinish(user)
    await user.type(within(dialog).getByLabelText('Bramki strzelone'), '4')
    await user.click(within(dialog).getByRole('button', { name: 'Anuluj' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    await user.click(within(rowOf('Delta')).getByText('Zakończ mecz'))

    expect(within(screen.getByRole('dialog')).getByLabelText('Bramki strzelone')).toHaveValue('')
  })
})

describe('deleting a match', () => {
  it('warns about the dependent data and deletes after confirmation', async () => {
    const { user, backend } = setup()
    await screen.findByText('Alpha')

    await user.click(within(rowOf('Alpha')).getByText('Usuń'))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Usunąć mecz?')).toBeInTheDocument()
    expect(within(dialog).getByText(/skasuje też jego skład, wszystkie zdarzenia meczowe i raporty o tym meczu/)).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Usuń' }))

    await waitFor(() => expect(screen.queryByText('Alpha')).not.toBeInTheDocument())
    expect(backend.deleted).toEqual(['1'])
  })

  it('does not delete when the confirmation is cancelled', async () => {
    const { user, backend } = setup()
    await screen.findByText('Alpha')
    await user.click(within(rowOf('Alpha')).getByText('Usuń'))

    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Anuluj' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(backend.deleted).toEqual([])
    expect(screen.getByText('Alpha')).toBeInTheDocument()
  })

  it('shows an error when the deletion fails', async () => {
    const { user } = setup(COACH, roster(), { failOn: { delete: new Response(null, { status: 500 }) } })
    await screen.findByText('Alpha')
    await user.click(within(rowOf('Alpha')).getByText('Usuń'))

    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Usuń' }))

    expect(await screen.findByText('Nie udało się usunąć meczu.')).toBeInTheDocument()
    expect(screen.getByText('Alpha')).toBeInTheDocument()
  })
})
