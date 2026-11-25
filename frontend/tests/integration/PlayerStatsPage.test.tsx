import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import type { PlayerSeasonStats } from '@/types/playerStats'
import { API, server } from '../mocks/server'
import { mockApi } from '../utils/mockApi'
import { ANALYST, renderApp } from '../utils/renderApp'

const row = (overrides: Partial<PlayerSeasonStats>): PlayerSeasonStats => ({
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

const stats = (): PlayerSeasonStats[] => [
  row({ playerId: 1, firstName: 'Jan', lastName: 'Kowalski', matches: 10, minutes: 900, goals: 5, assists: 2, yellowCards: 3, redCards: 0 }),
  row({ playerId: 2, firstName: 'Adam', lastName: 'Nowak', matches: 6, minutes: 450, goals: 9, assists: 0, yellowCards: 0, redCards: 1 }),
  row({ playerId: 3, firstName: 'Piotr', lastName: 'Zieliński', matches: 12, minutes: 1200, goals: 0, assists: 7, yellowCards: 1, redCards: 0 }),
  row({ playerId: 4, firstName: 'Old', lastName: 'Timer', season: '2024/25', goals: 99 }),
]

function setup(data = stats()) {
  mockApi('get', '/playerstats', data)
  renderApp('/stats/players', ANALYST)
  return { user: userEvent.setup({ delay: null }) }
}

const names = () =>
  screen
    .getAllByRole('row')
    .slice(1)
    .map((r) => within(r).getAllByRole('cell')[0].textContent)

const numbers = (column: number) =>
  screen
    .getAllByRole('row')
    .slice(1)
    .map((r) => within(r).getAllByRole('cell')[column].textContent)

describe('player statistics', () => {
  it('shows the players of the latest season with their numbers', async () => {
    setup()

    expect(await screen.findByText('Adam Nowak')).toBeInTheDocument()
    expect(screen.queryByText('Old Timer')).not.toBeInTheDocument()
    const nowak = screen.getByText('Adam Nowak').closest('tr') as HTMLElement
    expect(within(nowak).getAllByRole('cell').slice(1).map((c) => c.textContent)).toEqual(['6', '450', '9', '0', '0', '1'])
  })

  it('sorts by goals, best first, by default', async () => {
    setup()
    await screen.findByText('Adam Nowak')

    expect(numbers(3)).toEqual(['9', '5', '0'])
  })

  it.each([
    ['Mecze', 1, ['12', '10', '6']],
    ['Minuty', 2, ['1200', '900', '450']],
    ['Asysty', 4, ['7', '2', '0']],
    ['Żółte kartki', 5, ['3', '1', '0']],
    ['Czerwone kartki', 6, ['1', '0', '0']],
  ])('sorts by %s, highest first', async (label, column, expected) => {
    const { user } = setup()
    await screen.findByText('Adam Nowak')

    await user.click(screen.getByLabelText(label))

    expect(numbers(column)).toEqual(expected)
  })

  it('reverses the order when the same column is clicked again', async () => {
    const { user } = setup()
    await screen.findByText('Adam Nowak')

    await user.click(screen.getByLabelText('Bramki'))

    expect(numbers(3)).toEqual(['0', '5', '9'])
  })

  it('starts descending again when another column is chosen', async () => {
    const { user } = setup()
    await screen.findByText('Adam Nowak')
    await user.click(screen.getByLabelText('Bramki'))

    await user.click(screen.getByLabelText('Minuty'))

    expect(numbers(2)).toEqual(['1200', '900', '450'])
  })

  it('remembers the sorting', async () => {
    const { user } = setup()
    await screen.findByText('Adam Nowak')

    await user.click(screen.getByLabelText('Asysty'))

    expect(sessionStorage.getItem('playerStats.sortField')).toBe('"assists"')
    expect(sessionStorage.getItem('playerStats.sortAsc')).toBe('false')
  })

  it('shows photos, or initials when there is no photo', async () => {
    setup([row({ playerId: 1, firstName: 'Jan', lastName: 'Kowalski', photoUrl: '/uploads/jan.png' }), row({ playerId: 2, firstName: 'Adam', lastName: 'Nowak' })])
    await screen.findByText('Adam Nowak')

    expect(screen.getByText('Jan Kowalski').closest('tr')!.querySelector('img')).toHaveAttribute('src', 'http://localhost:5006/uploads/jan.png')
    expect(within(screen.getByText('Adam Nowak').closest('tr') as HTMLElement).getByText('AN')).toBeInTheDocument()
  })

  it('switches seasons', async () => {
    const { user } = setup()
    await screen.findByText('Adam Nowak')

    await user.click(screen.getByRole('combobox', { name: 'Sezon' }))
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['2025/26', '2024/25'])
    await user.click(screen.getByRole('option', { name: '2024/25' }))

    expect(names()).toEqual(['OTOld Timer'])
    expect(sessionStorage.getItem('playerStats.season')).toBe('"2024/25"')
  })

  it('falls back to the latest season when the remembered one does not exist', async () => {
    sessionStorage.setItem('playerStats.season', '"1999/00"')
    setup()

    expect(await screen.findByText('Adam Nowak')).toBeInTheDocument()
  })

  it('shows an empty table when there are no statistics', async () => {
    setup([])

    await screen.findByText('Statystyki zawodników', { selector: 'h4' })
    expect(screen.getAllByRole('row')).toHaveLength(1)
  })

  it('shows an error when the statistics cannot be loaded', async () => {
    server.use(http.get(`${API}/playerstats`, () => new HttpResponse(null, { status: 500 })))
    renderApp('/stats/players', ANALYST)

    expect(await screen.findByText('Nie udało się pobrać statystyk')).toBeInTheDocument()
  })

  it('links back to the team statistics', async () => {
    setup()
    await screen.findByText('Adam Nowak')

    expect(screen.getByLabelText('Wróć')).toHaveAttribute('href', '/stats')
  })
})
