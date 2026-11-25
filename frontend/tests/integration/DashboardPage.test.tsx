import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { API, server } from '../mocks/server'
import { makeKit, makeMatch, makeTeam } from '../utils/factories'
import { mockApi } from '../utils/mockApi'
import { ADMIN, ANALYST, COACH, renderApp } from '../utils/renderApp'

const today = new Date(2025, 5, 15, 10, 0)
const isoDay = (offset: number) => {
  const d = new Date(2025, 5, 15 + offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const team = {
  ...makeTeam({ id: 1, name: 'Cracovia', league: 'Ekstraklasa', homeKit: makeKit({ primaryColor: '#aa0000' }) }),
  staffMembers: [],
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(today)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('dashboard for team staff', () => {
  it('shows the team with its three kits', async () => {
    mockApi('get', '/teams', [team])
    mockApi('get', '/matches', [])

    renderApp('/')

    expect(await screen.findByText('Cracovia')).toBeInTheDocument()
    for (const label of ['Domowa', 'Wyjazdowa', 'Bramkarz']) expect(screen.getByText(label)).toBeInTheDocument()
  })

  it('shows navigation tiles for the staff areas', async () => {
    mockApi('get', '/teams', [team])
    mockApi('get', '/matches', [])

    renderApp('/')
    await screen.findByText('Cracovia')

    const tiles = Object.fromEntries(
      ['Zawodnicy', 'Mecze', 'Statystyki', 'Raporty'].map((label) => [
        label,
        screen.getByText(label, { selector: 'h6' }).closest('a')?.getAttribute('href'),
      ]),
    )
    expect(tiles).toEqual({ Zawodnicy: '/players', Mecze: '/matches', Statystyki: '/stats', Raporty: '/reports' })
    expect(screen.queryByText('Drużyny', { selector: 'h6' })).not.toBeInTheDocument()
    expect(screen.queryByText('Użytkownicy', { selector: 'h6' })).not.toBeInTheDocument()
  })

  it('lists the three nearest planned matches, soonest first, skipping played and past ones', async () => {
    mockApi('get', '/teams', [team])
    mockApi('get', '/matches', [
      makeMatch({ id: 1, opponent: 'Far Away', date: isoDay(20) }),
      makeMatch({ id: 2, opponent: 'Second', date: isoDay(3) }),
      makeMatch({ id: 3, opponent: 'First', date: isoDay(1) }),
      makeMatch({ id: 4, opponent: 'Past', date: isoDay(-4) }),
      makeMatch({ id: 5, opponent: 'Played', date: isoDay(2), status: 'Played', scoreFor: 1, scoreAgainst: 0 }),
      makeMatch({ id: 6, opponent: 'Third', date: isoDay(7) }),
    ])

    renderApp('/')

    const cards = await screen.findAllByRole('link', { name: /vs|Jutro|Za \d+ dni/ })
    expect(cards.map((c) => c.getAttribute('href'))).toEqual(['/matches/3', '/matches/2', '/matches/6'])
    expect(screen.queryByText('Far Away')).not.toBeInTheDocument()
    expect(screen.queryByText('Past')).not.toBeInTheDocument()
    expect(screen.queryByText('Played')).not.toBeInTheDocument()
  })

  it('opens the match when its card is clicked', async () => {
    mockApi('get', '/teams', [team])
    mockApi('get', '/matches', [makeMatch({ id: 3, opponent: 'First', date: isoDay(1) })])
    mockApi('get', '/matches/3', makeMatch({ id: 3, opponent: 'First', date: isoDay(1) }))
    mockApi('get', '/matchappearances/match/3', [])
    mockApi('get', '/matchevents/match/3', [])
    mockApi('get', '/players', [])
    mockApi('get', '/tacticalschemes/match/3', [])

    renderApp('/')
    await userEvent.setup({ delay: null }).click(await screen.findByText('First'))

    expect(await screen.findByLabelText('Wróć')).toHaveAttribute('href', '/matches')
  })

  it('navigates with a tile', async () => {
    mockApi('get', '/teams', [team])
    mockApi('get', '/matches', [])
    mockApi('get', '/players', [])

    renderApp('/')
    await userEvent.setup({ delay: null }).click(await screen.findByText('Zawodnicy', { selector: 'h6' }))

    expect(await screen.findByLabelText('Wróć')).toHaveAttribute('href', '/')
  })

  it('still shows the tiles when the team and matches cannot be loaded', async () => {
    server.use(
      http.get(`${API}/teams`, () => new HttpResponse(null, { status: 500 })),
      http.get(`${API}/matches`, () => new HttpResponse(null, { status: 500 })),
    )

    renderApp('/')

    expect(await screen.findByText('Zawodnicy', { selector: 'h6' })).toBeInTheDocument()
    expect(screen.queryByText('Domowa')).not.toBeInTheDocument()
  })

  it('offers the same areas to an analyst', async () => {
    mockApi('get', '/teams', [team])
    mockApi('get', '/matches', [])

    renderApp('/', ANALYST)

    expect(await screen.findByText('Raporty', { selector: 'h6' })).toBeInTheDocument()
    expect(screen.getByText('Mecze', { selector: 'h6' })).toBeInTheDocument()
  })
})

describe('dashboard for an administrator', () => {
  it('offers only teams and users, without loading team data', async () => {
    renderApp('/', ADMIN)

    const teams = await screen.findByText('Drużyny', { selector: 'h6' })
    expect(teams.closest('a')).toHaveAttribute('href', '/teams')
    expect(screen.getByText('Użytkownicy', { selector: 'h6' }).closest('a')).toHaveAttribute('href', '/users')
    expect(screen.queryByText('Zawodnicy', { selector: 'h6' })).not.toBeInTheDocument()
    expect(screen.queryByText('Domowa')).not.toBeInTheDocument()
  })

  it('shows the dashboard title and the administrator role in the header', async () => {
    renderApp('/', ADMIN)
    await screen.findByText('Drużyny', { selector: 'h6' })

    const header = screen.getByRole('banner')
    expect(within(header).getByText('Administrator')).toBeInTheDocument()
    expect(within(header).getByText('admin@test.local')).toBeInTheDocument()
  })
})

describe('role based routing', () => {
  it('keeps staff away from the administrator pages', async () => {
    mockApi('get', '/teams', [team])
    mockApi('get', '/matches', [])

    renderApp('/teams', COACH)

    expect(await screen.findByText('Cracovia')).toBeInTheDocument()
    expect(screen.getByText('Zawodnicy', { selector: 'h6' })).toBeInTheDocument()
  })
})
