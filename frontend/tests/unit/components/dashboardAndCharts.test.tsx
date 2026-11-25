import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextMatchesStrip } from '@/components/dashboard/NextMatchesStrip'
import { GoalsByPeriodChart } from '@/components/stats/GoalsByPeriodChart'
import { HomeAwayChart } from '@/components/stats/HomeAwayChart'
import { LeaguePointsChart } from '@/components/stats/LeaguePointsChart'
import { PlayerRankingChart } from '@/components/stats/PlayerRankingChart'
import { makeMatch } from '../../utils/factories'
import { renderWithProviders } from '../../utils/render'

describe('NextMatchesStrip', () => {
  const today = new Date(2025, 5, 15, 10, 0)
  const isoDay = (offset: number) => {
    const d = new Date(2025, 5, 15 + offset)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(today)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("shows today's date", () => {
    renderWithProviders(<NextMatchesStrip matches={[]} teamLeague={null} />)

    expect(screen.getByText('Dziś')).toBeInTheDocument()
    expect(screen.getByText(today.toLocaleDateString('pl-PL', { weekday: 'long' }))).toBeInTheDocument()
    expect(
      screen.getByText(today.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })),
    ).toBeInTheDocument()
  })

  it('shows no match cards when nothing is planned', () => {
    renderWithProviders(<NextMatchesStrip matches={[]} teamLeague={null} />)

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('links every match card to its page', () => {
    renderWithProviders(
      <NextMatchesStrip
        matches={[makeMatch({ id: 4, date: isoDay(1) }), makeMatch({ id: 9, date: isoDay(5) })]}
        teamLeague="Ekstraklasa"
      />,
    )

    expect(screen.getAllByRole('link').map((l) => l.getAttribute('href'))).toEqual(['/matches/4', '/matches/9'])
  })

  it('shows a capitalised countdown on every card', () => {
    renderWithProviders(
      <NextMatchesStrip
        matches={[
          makeMatch({ id: 1, date: isoDay(0) }),
          makeMatch({ id: 2, date: isoDay(1) }),
          makeMatch({ id: 3, date: isoDay(4) }),
        ]}
        teamLeague={null}
      />,
    )

    expect(screen.getByText('Dzisiaj')).toBeInTheDocument()
    expect(screen.getByText('Jutro')).toBeInTheDocument()
    expect(screen.getByText('Za 4 dni')).toBeInTheDocument()
  })

  it('invites to plan only the first match', () => {
    renderWithProviders(
      <NextMatchesStrip
        matches={[makeMatch({ id: 1, date: isoDay(1) }), makeMatch({ id: 2, date: isoDay(2) })]}
        teamLeague={null}
      />,
    )

    expect(screen.getAllByText(/Planuj mecz/)).toHaveLength(1)
  })

  it('describes the match: opponent, competition, round and venue', () => {
    renderWithProviders(
      <NextMatchesStrip
        matches={[makeMatch({ date: isoDay(2), opponent: 'Rival FC', matchType: 'League', round: '12', isHome: true })]}
        teamLeague="Ekstraklasa"
      />,
    )

    expect(screen.getByText('Rival FC')).toBeInTheDocument()
    expect(screen.getByText('Ekstraklasa · kolejka 12')).toBeInTheDocument()
    expect(screen.getByText(/· Dom$/)).toBeInTheDocument()
  })

  it('shows "Wyjazd" for away matches and no venue when it is not known', () => {
    const away = renderWithProviders(
      <NextMatchesStrip matches={[makeMatch({ date: isoDay(2), isHome: false })]} teamLeague={null} />,
    )
    expect(screen.getByText(/· Wyjazd$/)).toBeInTheDocument()
    away.unmount()

    renderWithProviders(<NextMatchesStrip matches={[makeMatch({ date: isoDay(2), isHome: null })]} teamLeague={null} />)
    expect(screen.queryByText(/Wyjazd|Dom/)).not.toBeInTheDocument()
  })

  it('shows the opponent logo when there is one, and its first letter otherwise', () => {
    const withLogo = renderWithProviders(
      <NextMatchesStrip
        matches={[makeMatch({ date: isoDay(2), opponent: 'Rival FC', opponentLogoUrl: '/uploads/r.png' })]}
        teamLeague={null}
      />,
    )
    expect(withLogo.container.querySelector('img')).toHaveAttribute('src', 'http://localhost:5006/uploads/r.png')
    withLogo.unmount()

    renderWithProviders(<NextMatchesStrip matches={[makeMatch({ date: isoDay(2), opponent: 'Rival FC' })]} teamLeague={null} />)
    expect(screen.getByText('R')).toBeInTheDocument()
  })
})

describe('PlayerRankingChart', () => {
  const options = [
    { value: 'goals', label: 'Gole' },
    { value: 'assists', label: 'Asysty' },
  ] as const

  function setup(rows = [{ name: 'Kowalski', value: 5 }], metric: 'goals' | 'assists' = 'goals') {
    const onMetricChange = vi.fn()
    render(
      <PlayerRankingChart
        title="Ranking"
        options={[...options]}
        metric={metric}
        onMetricChange={onMetricChange}
        rows={rows}
      />,
    )
    return { onMetricChange, user: userEvent.setup() }
  }

  it('shows the title and a toggle for every metric', () => {
    setup()

    expect(screen.getByText('Ranking')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gole' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Asysty' })).toBeInTheDocument()
  })

  it('marks the current metric as pressed', () => {
    setup([{ name: 'Kowalski', value: 5 }], 'assists')

    expect(screen.getByRole('button', { name: 'Asysty' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Gole' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('reports a different metric when chosen', async () => {
    const { user, onMetricChange } = setup()

    await user.click(screen.getByRole('button', { name: 'Asysty' }))

    expect(onMetricChange).toHaveBeenCalledWith('assists')
  })

  it('does not unselect the current metric', async () => {
    const { user, onMetricChange } = setup()

    await user.click(screen.getByRole('button', { name: 'Gole' }))

    expect(onMetricChange).not.toHaveBeenCalled()
  })

  it('says there is no data when there are no rows', () => {
    setup([])

    expect(screen.getByText('Brak danych w tym sezonie.')).toBeInTheDocument()
  })

  it('does not show the empty message when there are rows', () => {
    setup()

    expect(screen.queryByText('Brak danych w tym sezonie.')).not.toBeInTheDocument()
  })
})

describe('other charts', () => {
  it('shows the league points summary', () => {
    render(<LeaguePointsChart points={[3, 4, 7]} />)

    expect(screen.getByText('Punkty w lidze: 7 pkt po 3 kolejkach')).toBeInTheDocument()
  })

  it('shows zero points before the first round', () => {
    render(<LeaguePointsChart points={[]} />)

    expect(screen.getByText('Punkty w lidze: 0 pkt po 0 kolejkach')).toBeInTheDocument()
  })

  it('renders the goals by period chart', () => {
    render(<GoalsByPeriodChart scored={[1, 0, 2, 0, 1, 0, 0]} conceded={[0, 1, 0, 0, 0, 2, 0]} />)

    expect(screen.getByText('Bramki w czasie gry')).toBeInTheDocument()
  })

  it('renders the goals by period chart with extra time', () => {
    render(<GoalsByPeriodChart scored={[0, 0, 0, 0, 0, 0, 1]} conceded={[0, 0, 0, 0, 0, 0, 0]} />)

    expect(screen.getByText('Bramki w czasie gry')).toBeInTheDocument()
  })

  it('renders the home and away chart', () => {
    const summary = { matches: 5, wins: 3, draws: 1, losses: 1, goalsFor: 9, goalsAgainst: 4, cleanSheets: 2 }

    render(<HomeAwayChart home={summary} away={summary} />)

    expect(screen.getByText('Dom / Wyjazd')).toBeInTheDocument()
  })
})
