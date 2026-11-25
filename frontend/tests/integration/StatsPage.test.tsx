import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { PlayerSeasonStats } from '@/types/playerStats'
import type { TeamSeasonStats } from '@/types/teamStats'
import { makeResult } from '../utils/factories'
import { chartLabels, installSizedCharts } from '../utils/chartSizing'
import { mockApi } from '../utils/mockApi'
import { ANALYST, renderApp } from '../utils/renderApp'
import { server, API } from '../mocks/server'
import { http, HttpResponse } from 'msw'

installSizedCharts()

const season = (overrides: Partial<TeamSeasonStats> = {}): TeamSeasonStats => ({
  season: '2025/26',
  results: [
    makeResult({ matchId: 1, scoreFor: 2, scoreAgainst: 0, matchType: 'League', isHome: true, opponent: 'Alpha' }),
    makeResult({ matchId: 2, scoreFor: 1, scoreAgainst: 1, matchType: 'League', isHome: false, opponent: 'Beta' }),
    makeResult({ matchId: 3, scoreFor: 0, scoreAgainst: 3, matchType: 'Cup', isHome: false, opponent: 'Gamma' }),
    makeResult({ matchId: 4, scoreFor: 3, scoreAgainst: 1, matchType: 'Friendly', isHome: true, opponent: 'Delta' }),
  ],
  goalsScoredByPeriod: [1, 0, 2, 1, 0, 2, 0],
  goalsConcededByPeriod: [0, 1, 0, 1, 2, 1, 0],
  yellowCards: 7,
  redCards: 1,
  ...overrides,
})

const playerRow = (overrides: Partial<PlayerSeasonStats>): PlayerSeasonStats => ({
  playerId: 1,
  firstName: 'Jan',
  lastName: 'Kowalski',
  photoUrl: null,
  season: '2025/26',
  matches: 10,
  minutes: 900,
  goals: 5,
  assists: 2,
  yellowCards: 1,
  redCards: 0,
  ...overrides,
})

const players = (): PlayerSeasonStats[] => [
  playerRow({ playerId: 1, lastName: 'Kowalski', goals: 5, minutes: 900, matches: 10, assists: 2, yellowCards: 3 }),
  playerRow({ playerId: 2, lastName: 'Nowak', goals: 9, minutes: 450, matches: 6, assists: 0, yellowCards: 0 }),
  playerRow({ playerId: 3, lastName: 'Zieliński', goals: 0, minutes: 1200, matches: 12, assists: 7, yellowCards: 1 }),
  playerRow({ playerId: 4, lastName: 'Lewy', goals: 2, minutes: 0, matches: 0, assists: 0, yellowCards: 0 }),
  playerRow({ playerId: 5, lastName: 'Old', season: '2024/25', goals: 99, minutes: 99, matches: 99 }),
]

function setup(teamStats: TeamSeasonStats[] = [season()], playerStats = players()) {
  mockApi('get', '/teamstats', teamStats)
  mockApi('get', '/playerstats', playerStats)
  renderApp('/stats', ANALYST)
  return { user: userEvent.setup({ delay: null }) }
}

const tileOf = (label: string) => screen.getByText(label, { selector: 'p' }).closest('.MuiPaper-root') as HTMLElement
const chartOf = (title: string) => screen.getByText(title).closest('.MuiPaper-root') as HTMLElement

describe('season summary', () => {
  it('shows the number of matches with the record', async () => {
    setup()

    await screen.findByText('Statystyki', { selector: 'h4' })
    const tile = within(tileOf('Mecze'))
    expect(tile.getByText('4')).toBeInTheDocument()
    expect(tile.getByText('2 W · 1 R · 1 P')).toBeInTheDocument()
  })

  it('shows goals scored and conceded, the difference and the average', async () => {
    setup()

    await screen.findByText('Statystyki', { selector: 'h4' })
    const tile = within(tileOf('Bramki'))
    expect(tile.getByText('6:5')).toBeInTheDocument()
    expect(tile.getByText('+1, 1,50 na mecz')).toBeInTheDocument()
  })

  it('shows a negative goal difference without a plus', async () => {
    setup([season({ results: [makeResult({ scoreFor: 0, scoreAgainst: 2 }), makeResult({ matchId: 2, scoreFor: 1, scoreAgainst: 1 })] })])

    await screen.findByText('Statystyki', { selector: 'h4' })
    expect(within(tileOf('Bramki')).getByText('-2, 0,50 na mecz')).toBeInTheDocument()
  })

  it('shows clean sheets with their share of the matches', async () => {
    setup()

    await screen.findByText('Statystyki', { selector: 'h4' })
    const tile = within(tileOf('Czyste konta'))
    expect(tile.getByText('1')).toBeInTheDocument()
    expect(tile.getByText('25% meczów')).toBeInTheDocument()
  })

  it('shows yellow and red cards', async () => {
    setup()

    await screen.findByText('Statystyki', { selector: 'h4' })
    const tile = within(tileOf('Kartki'))
    expect(tile.getByText('7 · 1')).toBeInTheDocument()
    expect(tile.getByText('żółte · czerwone')).toBeInTheDocument()
  })

  it('links to the player statistics', async () => {
    setup()

    expect(await screen.findByRole('link', { name: 'Statystyki zawodników →' })).toHaveAttribute('href', '/stats/players')
  })
})

describe('form and charts', () => {
  it('shows the last results as a form strip, oldest first', async () => {
    setup()

    await screen.findByText('Forma: ostatnie mecze')
    const links = screen.getAllByRole('link').filter((l) => /^\/matches\//.test(l.getAttribute('href') ?? ''))
    expect(links.map((l) => l.textContent)).toEqual(['W', 'R', 'P', 'W'])
  })

  it('shows only the ten latest results', async () => {
    const results = Array.from({ length: 12 }, (_, i) => makeResult({ matchId: i + 1, scoreFor: i, scoreAgainst: 0 }))
    setup([season({ results })])

    await screen.findByText('Forma: ostatnie mecze')
    const links = screen.getAllByRole('link').filter((l) => /^\/matches\//.test(l.getAttribute('href') ?? ''))
    expect(links.map((l) => l.getAttribute('href'))).toEqual(
      Array.from({ length: 10 }, (_, i) => `/matches/${i + 3}`),
    )
  })

  it('counts league points only for league matches', async () => {
    setup()

    expect(await screen.findByText('Punkty w lidze: 4 pkt po 2 kolejkach')).toBeInTheDocument()
  })

  it('accumulates league points match by match', async () => {
    setup([
      season({
        results: [
          makeResult({ matchId: 1, scoreFor: 1, scoreAgainst: 0 }),
          makeResult({ matchId: 2, scoreFor: 0, scoreAgainst: 1 }),
          makeResult({ matchId: 3, scoreFor: 2, scoreAgainst: 2 }),
          makeResult({ matchId: 4, scoreFor: 3, scoreAgainst: 0 }),
        ],
      }),
    ])

    expect(await screen.findByText('Punkty w lidze: 7 pkt po 4 kolejkach')).toBeInTheDocument()
  })

  it('hides the league chart when there were no league matches', async () => {
    setup([season({ results: [makeResult({ matchType: 'Cup' }), makeResult({ matchId: 2, matchType: 'Friendly' })] })])

    await screen.findByText('Forma: ostatnie mecze')
    expect(screen.queryByText(/Punkty w lidze/)).not.toBeInTheDocument()
  })

  it('shows the home and away chart and the goals by period chart', async () => {
    setup()

    expect(await screen.findByText('Dom / Wyjazd')).toBeInTheDocument()
    expect(screen.getByText('Bramki w czasie gry')).toBeInTheDocument()
  })

  it('does not show extra time when there were no goals in it', async () => {
    setup([season({ goalsScoredByPeriod: [1, 0, 0, 0, 0, 0, 0], goalsConcededByPeriod: [0, 0, 0, 0, 0, 0, 0] })])
    await screen.findByText('Bramki w czasie gry')

    const labels = chartLabels(chartOf('Bramki w czasie gry'))
    expect(labels).toContain('0-15')
    expect(labels).not.toContain('Dogrywka')
  })

  it('shows the extra time period when goals were scored in it', async () => {
    setup([season({ goalsScoredByPeriod: [0, 0, 0, 0, 0, 0, 1], goalsConcededByPeriod: [0, 0, 0, 0, 0, 0, 0] })])
    await screen.findByText('Bramki w czasie gry')

    expect(chartLabels(chartOf('Bramki w czasie gry'))).toContain('Dogrywka')
  })
})

describe('player rankings', () => {
  it('ranks the players of the season by goals, best first, skipping players with none', async () => {
    setup()
    await screen.findByText('Ranking zawodników')

    const ranking = chartLabels(chartOf('Ranking zawodników')).filter((l) => ['Kowalski', 'Nowak', 'Zieliński', 'Lewy', 'Old'].includes(l))
    expect(ranking).toEqual(['Nowak', 'Kowalski', 'Lewy'])
  })

  it('ranks by minutes by default in the minutes chart', async () => {
    setup()
    await screen.findByText('Minuty zawodników')

    const ranking = chartLabels(chartOf('Minuty zawodników')).filter((l) => ['Kowalski', 'Nowak', 'Zieliński', 'Lewy', 'Old'].includes(l))
    expect(ranking).toEqual(['Zieliński', 'Kowalski', 'Nowak'])
  })

  it('switches the metric of a ranking', async () => {
    const { user } = setup()
    await screen.findByText('Ranking zawodników')

    await user.click(within(chartOf('Ranking zawodników')).getByRole('button', { name: 'Asysty' }))

    const ranking = chartLabels(chartOf('Ranking zawodników')).filter((l) => ['Kowalski', 'Nowak', 'Zieliński'].includes(l))
    expect(ranking).toEqual(['Zieliński', 'Kowalski'])
    expect(sessionStorage.getItem('stats.rankingMetric')).toBe('"assists"')
  })

  it('switches the minutes chart to matches played', async () => {
    const { user } = setup()
    await screen.findByText('Minuty zawodników')

    await user.click(within(chartOf('Minuty zawodników')).getByRole('button', { name: 'Mecze' }))

    const ranking = chartLabels(chartOf('Minuty zawodników')).filter((l) => ['Kowalski', 'Nowak', 'Zieliński'].includes(l))
    expect(ranking).toEqual(['Zieliński', 'Kowalski', 'Nowak'])
    expect(sessionStorage.getItem('stats.minutesMetric')).toBe('"matches"')
  })

  it('says so when nobody has anything in the chosen metric', async () => {
    const { user } = setup(undefined, [playerRow({ yellowCards: 0 })])
    await screen.findByText('Ranking zawodników')

    await user.click(within(chartOf('Ranking zawodników')).getByRole('button', { name: 'Kartki' }))

    expect(within(chartOf('Ranking zawodników')).getByText('Brak danych w tym sezonie.')).toBeInTheDocument()
  })

  it('shows at most eight players', async () => {
    const many = Array.from({ length: 12 }, (_, i) => playerRow({ playerId: i + 1, lastName: `Player${String(i).padStart(2, '0')}`, goals: 20 - i }))
    setup(undefined, many)
    await screen.findByText('Ranking zawodników')

    const ranking = chartLabels(chartOf('Ranking zawodników')).filter((l) => l.startsWith('Player'))
    expect(ranking).toHaveLength(8)
    expect(ranking[0]).toBe('Player00')
    expect(ranking).not.toContain('Player08')
  })
})

describe('season selection', () => {
  const twoSeasons = () => [
    season({ season: '2025/26' }),
    season({ season: '2024/25', results: [makeResult({ scoreFor: 5, scoreAgainst: 0 })], yellowCards: 2, redCards: 0 }),
  ]

  it('opens the latest season and lists all of them', async () => {
    const { user } = setup(twoSeasons())
    await screen.findByText('Statystyki', { selector: 'h4' })
    expect(within(tileOf('Mecze')).getByText('4')).toBeInTheDocument()

    await user.click(screen.getByRole('combobox', { name: 'Sezon' }))

    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['2025/26', '2024/25'])
  })

  it('shows the chosen season and remembers it', async () => {
    const { user } = setup(twoSeasons())
    await screen.findByText('Statystyki', { selector: 'h4' })

    await user.click(screen.getByRole('combobox', { name: 'Sezon' }))
    await user.click(screen.getByRole('option', { name: '2024/25' }))

    expect(within(tileOf('Mecze')).getByText('1')).toBeInTheDocument()
    expect(within(tileOf('Bramki')).getByText('5:0')).toBeInTheDocument()
    expect(sessionStorage.getItem('stats.season')).toBe('"2024/25"')
  })

  it('falls back to the latest season when the remembered one does not exist', async () => {
    sessionStorage.setItem('stats.season', '"1999/00"')
    setup(twoSeasons())

    await screen.findByText('Statystyki', { selector: 'h4' })
    expect(within(tileOf('Mecze')).getByText('4')).toBeInTheDocument()
  })
})

describe('empty and error states', () => {
  it('says so when there are no played matches', async () => {
    setup([], [])

    expect(await screen.findByText('Brak rozegranych meczów.')).toBeInTheDocument()
  })

  it('shows an error when the team statistics cannot be loaded', async () => {
    server.use(http.get(`${API}/teamstats`, () => new HttpResponse(null, { status: 500 })))
    mockApi('get', '/playerstats', [])
    renderApp('/stats', ANALYST)

    expect(await screen.findByText('Nie udało się pobrać statystyk')).toBeInTheDocument()
  })

  it('shows an error when the player statistics cannot be loaded', async () => {
    mockApi('get', '/teamstats', [season()])
    server.use(http.get(`${API}/playerstats`, () => new HttpResponse(null, { status: 500 })))
    renderApp('/stats', ANALYST)

    expect(await screen.findByText('Nie udało się pobrać statystyk')).toBeInTheDocument()
  })
})
