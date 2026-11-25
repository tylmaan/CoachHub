import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Match } from '@/types/match'
import type { MatchAppearance } from '@/types/matchAppearance'
import type { MatchEvent } from '@/types/matchEvent'
import { makeMatch, makePlayer, makeTeam } from '../utils/factories'
import { fakeMatchDetail } from '../utils/fakeMatchDetail'
import { ANALYST, ASSISTANT, COACH, renderApp } from '../utils/renderApp'

const players = [
  makePlayer({ id: 1, firstName: 'Jan', lastName: 'Kowalski', position: 'GK', jerseyNumber: 1 }),
  makePlayer({ id: 2, firstName: 'Adam', lastName: 'Nowak', position: 'CB', jerseyNumber: 4 }),
  makePlayer({ id: 3, firstName: 'Piotr', lastName: 'Zieliński', position: 'CM', jerseyNumber: 8 }),
  makePlayer({ id: 4, firstName: 'Marek', lastName: 'Lewy', position: 'ST', jerseyNumber: 9 }),
  makePlayer({ id: 5, firstName: 'Old', lastName: 'Timer', position: 'CB', jerseyNumber: 3, archivedAt: '2025-01-01' }),
  makePlayer({ id: 6, firstName: 'Defender', lastName: 'Two', position: 'CB', jerseyNumber: 5 }),
]

const lineup = (): MatchAppearance[] => [
  { id: 101, matchId: 5, playerId: 1, isStarting: true, position: 'GK-0' },
  { id: 102, matchId: 5, playerId: 2, isStarting: true, position: 'CB-2' },
  { id: 103, matchId: 5, playerId: 3, isStarting: false, position: null },
]

const team = {
  ...makeTeam({ id: 1, name: 'Cracovia', league: 'Ekstraklasa' }),
  staffMembers: [],
}

const playedMatch = (overrides: Partial<Match> = {}) =>
  makeMatch({
    id: 5,
    opponent: 'Rival FC',
    status: 'Played',
    scoreFor: 2,
    scoreAgainst: 1,
    date: '2025-09-10',
    season: '2025/26',
    round: '5',
    matchType: 'League',
    isHome: true,
    formation: '433',
    ...overrides,
  })

const plannedMatch = (overrides: Partial<Match> = {}) =>
  makeMatch({ id: 5, opponent: 'Rival FC', status: 'Planned', scoreFor: null, scoreAgainst: null, ...overrides })

let nextEventId = 1
const event = (overrides: Partial<MatchEvent>): MatchEvent => ({
  id: nextEventId++,
  eventType: 'Goal',
  team: 'Us',
  minute: 10,
  addedTime: null,
  matchId: 5,
  playerId: 4,
  opponentPlayerName: null,
  ...overrides,
})

function setup(input: Partial<Parameters<typeof fakeMatchDetail>[0]> = {}, auth = COACH) {
  const backend = fakeMatchDetail({
    match: playedMatch(),
    players,
    appearances: lineup(),
    events: [],
    team,
    ...input,
  })
  renderApp('/matches/5', auth)
  return { backend, user: userEvent.setup({ delay: null }) }
}

const slotOf = (label: string) => screen.getByText(label).closest('[data-drop-key]') as HTMLElement
const benchZone = () => document.querySelector('[data-drop-key="bench"]') as HTMLElement

describe('match header', () => {
  it('shows the opponent, the competition, the details and the score', async () => {
    setup()

    expect(await screen.findByRole('heading', { name: 'Rival FC' })).toBeInTheDocument()
    expect(screen.getByText('Ekstraklasa')).toBeInTheDocument()
    expect(screen.getByText('2025-09-10 · 2025/26 · 5 · Dom')).toBeInTheDocument()
    expect(screen.getByText('2 : 1')).toBeInTheDocument()
  })

  it('shows the cup competition, or the category for other matches', async () => {
    setup({ match: playedMatch({ matchType: 'Cup', competition: 'Puchar Polski', round: 'Półfinał', isHome: false }) })

    expect(await screen.findByText('Puchar Polski')).toBeInTheDocument()
    expect(screen.getByText('2025-09-10 · 2025/26 · Półfinał · Wyjazd')).toBeInTheDocument()
  })

  it('labels friendly matches by their category', async () => {
    setup({ match: playedMatch({ matchType: 'Friendly', round: null, isHome: null }) })

    expect(await screen.findByText('Towarzyski')).toBeInTheDocument()
    expect(screen.getByText('2025-09-10 · 2025/26')).toBeInTheDocument()
  })

  it('shows no score for a planned match', async () => {
    setup({ match: plannedMatch() })

    await screen.findByRole('heading', { name: 'Rival FC' })
    expect(screen.queryByText(/\d : \d/)).not.toBeInTheDocument()
  })

  it('shows the opponent logo, or its initial', async () => {
    setup({ match: playedMatch({ opponentLogoUrl: '/uploads/r.png' }) })

    await screen.findByRole('heading', { name: 'Rival FC' })
    expect(document.querySelector('img')).toHaveAttribute('src', 'http://localhost:5006/uploads/r.png')
  })

  it('shows an error when the match cannot be loaded', async () => {
    setup({ failOn: { match: new Response(null, { status: 500 }) } })

    expect(await screen.findByText('Nie udało się pobrać meczu.')).toBeInTheDocument()
  })

  it('shows an error for a match that does not exist', async () => {
    setup({ match: playedMatch({ id: 77 }) })

    expect(await screen.findByText('Nie udało się pobrać meczu.')).toBeInTheDocument()
  })

  it('links back to the matches list', async () => {
    setup()
    await screen.findByRole('heading', { name: 'Rival FC' })

    expect(screen.getByLabelText('Wróć')).toHaveAttribute('href', '/matches')
  })
})

describe('lineup', () => {
  it('places starters on the pitch and substitutes on the bench', async () => {
    setup()

    expect(await screen.findByText('Kowalski')).toBeInTheDocument()
    expect(slotOf('Kowalski').getAttribute('data-drop-key')).toBe('GK-0')
    expect(slotOf('Nowak').getAttribute('data-drop-key')).toBe('CB-2')
    expect(benchZone()).toContainElement(screen.getByText('Zieliński'))
  })

  it('shows the position code in empty slots', async () => {
    setup()
    await screen.findByText('Kowalski')

    for (const code of ['LB', 'RB', 'CAM', 'LW', 'ST', 'RW']) expect(screen.getByText(code)).toBeInTheDocument()
    expect(screen.getAllByText('CM')).toHaveLength(2)
  })

  it('shows eleven slots and twelve bench places', async () => {
    setup()
    await screen.findByText('Kowalski')

    expect(document.querySelectorAll('[data-drop-key]:not([data-drop-key="bench"])')).toHaveLength(11)
    expect(benchZone().children).toHaveLength(12)
  })

  it('uses the formation of the match, defaulting to 4-3-3', async () => {
    setup({ match: playedMatch({ formation: '442' }) })
    await screen.findByText('Kowalski')

    expect(screen.getByRole('combobox', { name: 'Formacja' })).toHaveTextContent('4-4-2')
    expect(screen.getByText('LM')).toBeInTheDocument()
    expect(screen.queryByText('LW')).not.toBeInTheDocument()
  })

  it('falls back to 4-3-3 when the match has no formation', async () => {
    setup({ match: playedMatch({ formation: null }) })
    await screen.findByText('Kowalski')

    expect(screen.getByRole('combobox', { name: 'Formacja' })).toHaveTextContent('4-3-3')
  })

  it('shows the shirt numbers of the players', async () => {
    setup()
    await screen.findByText('Kowalski')

    expect(slotOf('Kowalski').querySelector('svg text')).toHaveTextContent('1')
    expect(slotOf('Nowak').querySelector('svg text')).toHaveTextContent('4')
  })
})

describe('changing the formation', () => {
  async function chooseFormation(user: ReturnType<typeof userEvent.setup>, label: string) {
    await screen.findByText('Kowalski')
    await user.click(screen.getByRole('combobox', { name: 'Formacja' }))
    await user.click(screen.getByRole('option', { name: label }))
  }

  it('saves the formation and clears the starting lineup, keeping the bench', async () => {
    const { user, backend } = setup()

    await chooseFormation(user, '4-4-2')

    await waitFor(() => expect(backend.appearancesDeleted.sort()).toEqual([101, 102]))
    expect(backend.matchUpdates).toHaveLength(1)
    expect(backend.matchUpdates[0]).toMatchObject({ formation: '442', opponent: 'Rival FC' })
    expect(backend.matchUpdates[0]).not.toHaveProperty('id')
    expect(await screen.findByText('LM')).toBeInTheDocument()
    expect(screen.queryByText('Kowalski')).not.toBeInTheDocument()
    expect(screen.getByText('Zieliński')).toBeInTheDocument()
  })

  it('reports a failure to save the formation', async () => {
    const { user } = setup({ failOn: { updateMatch: new Response(null, { status: 500 }) } })

    await chooseFormation(user, '4-4-2')

    expect(await screen.findByText('Nie udało się zapisać formacji.')).toBeInTheDocument()
  })

  it('is reserved for the coach', async () => {
    setup({}, ASSISTANT)
    await screen.findByText('Kowalski')

    expect(screen.getByRole('combobox', { name: 'Formacja' })).toHaveAttribute('aria-disabled', 'true')
  })
})

describe('choosing a player for the lineup', () => {
  async function openSlot(user: ReturnType<typeof userEvent.setup>, label: string) {
    await screen.findByText('Kowalski')
    await user.click(screen.getByText(label))
    return screen.findByRole('dialog')
  }

  it('opens a picker for the position, on the matching position group', async () => {
    const { user } = setup()

    const dialog = await openSlot(user, 'LB')

    expect(within(dialog).getByText('Pozycja: LB')).toBeInTheDocument()
    expect(within(dialog).getByRole('tab', { name: 'Obrońcy' })).toHaveAttribute('aria-selected', 'true')
  })

  it('lists the active players of the group, marking those already in the lineup', async () => {
    const { user } = setup()

    const dialog = await openSlot(user, 'LB')

    expect(within(dialog).getByRole('button', { name: /Adam Nowak/ })).toBeDisabled()
    expect(within(dialog).getByText('w składzie')).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: /Defender Two/ })).toBeEnabled()
    expect(within(dialog).queryByText('Old Timer')).not.toBeInTheDocument()
  })

  it('switches between position groups', async () => {
    const { user } = setup()
    const dialog = await openSlot(user, 'LB')

    await user.click(within(dialog).getByRole('tab', { name: 'Napastnicy' }))

    expect(within(dialog).getByRole('button', { name: /Marek Lewy/ })).toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: /Defender Two/ })).not.toBeInTheDocument()
  })

  it('searches all players regardless of the position group', async () => {
    const { user } = setup()
    const dialog = await openSlot(user, 'LB')

    await user.type(within(dialog).getByPlaceholderText('Szukaj zawodnika'), 'LEWY')

    expect(within(dialog).getByRole('button', { name: /Marek Lewy/ })).toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: /Defender Two/ })).not.toBeInTheDocument()
  })

  it('says so when nobody matches the search', async () => {
    const { user } = setup()
    const dialog = await openSlot(user, 'LB')

    await user.type(within(dialog).getByPlaceholderText('Szukaj zawodnika'), 'zzz')

    expect(within(dialog).getByText('Brak zawodników.')).toBeInTheDocument()
  })

  it('adds the chosen player to the slot', async () => {
    const { user, backend } = setup()
    const dialog = await openSlot(user, 'LB')

    await user.click(within(dialog).getByRole('tab', { name: 'Napastnicy' }))
    await user.click(within(dialog).getByRole('button', { name: /Marek Lewy/ }))

    expect(await screen.findByText('Lewy')).toBeInTheDocument()
    expect(backend.appearancesCreated).toEqual([{ matchId: 5, playerId: 4, isStarting: true, position: 'LB-1' }])
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('replaces the player of an occupied slot', async () => {
    const { user, backend } = setup()
    const dialog = await openSlot(user, 'Nowak')

    await user.click(within(dialog).getByRole('button', { name: /Defender Two/ }))

    expect(await screen.findByText('Two')).toBeInTheDocument()
    expect(backend.appearancesUpdated).toEqual([
      { id: 102, body: { matchId: 5, playerId: 6, isStarting: true, position: 'CB-2' } },
    ])
    expect(backend.appearancesCreated).toEqual([])
  })

  it('removes the player from the slot', async () => {
    const { user, backend } = setup()
    const dialog = await openSlot(user, 'Nowak')

    await user.click(within(dialog).getByRole('button', { name: 'Usuń z tej pozycji' }))

    await waitFor(() => expect(screen.queryByText('Nowak')).not.toBeInTheDocument())
    expect(backend.appearancesDeleted).toEqual([102])
  })

  it('does not offer removing from an empty slot', async () => {
    const { user } = setup()
    const dialog = await openSlot(user, 'LB')

    expect(within(dialog).queryByRole('button', { name: 'Usuń z tej pozycji' })).not.toBeInTheDocument()
  })

  it('sorts matching players first, then those not yet in the lineup, then by shirt number', async () => {
    const roster = [
      makePlayer({ id: 11, firstName: 'A', lastName: 'Eleven', position: 'ST', jerseyNumber: 11 }),
      makePlayer({ id: 12, firstName: 'B', lastName: 'Seven', position: 'ST', jerseyNumber: 7 }),
      makePlayer({ id: 13, firstName: 'C', lastName: 'Nine', position: 'ST', jerseyNumber: 9 }),
      makePlayer({ id: 14, firstName: 'D', lastName: 'Ten', position: 'CF', jerseyNumber: 10 }),
    ]
    const { user } = setup({
      players: roster,
      appearances: [{ id: 201, matchId: 5, playerId: 13, isStarting: false, position: null }],
    })
    await screen.findByText('RW')

    await user.click(screen.getByText('ST'))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('tab', { name: 'Napastnicy' }))

    const order = within(dialog).getAllByRole('button').map((b) => b.textContent ?? '')
    const names = ['Seven', 'Eleven', 'Nine', 'Ten'].map((name) => order.findIndex((text) => text.includes(name)))
    expect(names).toEqual([...names].sort((a, b) => a - b))
  })

  it('reports a failure to add the player', async () => {
    const { user } = setup({ failOn: { createAppearance: new Response(null, { status: 500 }) } })
    const dialog = await openSlot(user, 'LB')
    await user.click(within(dialog).getByRole('button', { name: /Defender Two/ }))

    expect(await screen.findByText('Nie udało się dodać zawodnika do składu.')).toBeInTheDocument()
  })

  it('reports a failure to remove the player', async () => {
    const { user } = setup({ failOn: { deleteAppearance: new Response(null, { status: 500 }) } })
    const dialog = await openSlot(user, 'Nowak')
    await user.click(within(dialog).getByRole('button', { name: 'Usuń z tej pozycji' }))

    expect(await screen.findByText('Nie udało się usunąć zawodnika ze składu.')).toBeInTheDocument()
  })

  it('closes without changes', async () => {
    const { user, backend } = setup()
    const dialog = await openSlot(user, 'LB')

    await user.click(within(dialog).getByRole('button', { name: 'Zamknij' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(backend.appearancesCreated).toEqual([])
  })
})

describe('bench', () => {
  it('adds a substitute to the bench', async () => {
    const { user, backend } = setup()
    await screen.findByText('Kowalski')

    await user.click(benchZone().children[1] as HTMLElement)
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Ławka rezerwowych')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('tab', { name: 'Napastnicy' }))
    await user.click(within(dialog).getByRole('button', { name: /Marek Lewy/ }))

    await waitFor(() => expect(backend.appearancesCreated).toHaveLength(1))
    expect(backend.appearancesCreated[0]).toEqual({ matchId: 5, playerId: 4, isStarting: false, position: null })
  })

  it('removes a substitute from the bench', async () => {
    const { user, backend } = setup()
    await screen.findByText('Kowalski')

    await user.click(screen.getByText('Zieliński'))
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Usuń z tej pozycji' }))

    await waitFor(() => expect(backend.appearancesDeleted).toEqual([103]))
  })
})

describe('lineup permissions', () => {
  it('lets an assistant choose players, but not remove them', async () => {
    const { user } = setup({}, ASSISTANT)
    await screen.findByText('Kowalski')

    await user.click(screen.getByText('Nowak'))
    const dialog = await screen.findByRole('dialog')

    expect(within(dialog).getByRole('tab', { name: 'Obrońcy' })).toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: 'Usuń z tej pozycji' })).not.toBeInTheDocument()
  })

  it('lets an analyst only look at the lineup', async () => {
    const { user } = setup({}, ANALYST)
    await screen.findByText('Kowalski')

    await user.click(screen.getByText('LB'))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('Kowalski').closest('[draggable]')).toBeNull()
    expect(document.querySelectorAll('[data-drop-key]')).toHaveLength(0)
  })
})

describe('moving players by drag and drop', () => {
  function drag(source: HTMLElement, target: HTMLElement) {
    fireEvent.dragStart(source, { dataTransfer: { effectAllowed: '' } })
    fireEvent.dragOver(target)
    fireEvent.drop(target)
  }

  it('moves a starter to an empty slot', async () => {
    const { backend } = setup()
    await screen.findByText('Kowalski')

    drag(slotOf('Nowak'), slotOf('LB'))

    await waitFor(() => expect(backend.appearancesUpdated).toHaveLength(1))
    expect(backend.appearancesUpdated[0]).toEqual({
      id: 102,
      body: { matchId: 5, playerId: 2, isStarting: true, position: 'LB-1' },
    })
    expect(await screen.findByText('RB')).toBeInTheDocument()
    expect(slotOf('Nowak').getAttribute('data-drop-key')).toBe('LB-1')
  })

  it('swaps two starters when dropped on an occupied slot', async () => {
    const { backend } = setup()
    await screen.findByText('Kowalski')

    drag(slotOf('Nowak'), slotOf('Kowalski'))

    await waitFor(() => expect(backend.appearancesUpdated).toHaveLength(2))
    expect(backend.appearancesUpdated).toEqual([
      { id: 102, body: { matchId: 5, playerId: 2, isStarting: true, position: 'GK-0' } },
      { id: 101, body: { matchId: 5, playerId: 1, isStarting: true, position: 'CB-2' } },
    ])
  })

  it('sends a starter to the bench', async () => {
    const { backend } = setup()
    await screen.findByText('Kowalski')

    drag(slotOf('Nowak'), benchZone())

    await waitFor(() => expect(backend.appearancesUpdated).toHaveLength(1))
    expect(backend.appearancesUpdated[0].body).toEqual({ matchId: 5, playerId: 2, isStarting: false, position: null })
  })

  it('brings a substitute onto an empty slot', async () => {
    const { backend } = setup()
    await screen.findByText('Kowalski')

    drag(screen.getByText('Zieliński').closest('[draggable="true"]') as HTMLElement, slotOf('RB'))

    await waitFor(() => expect(backend.appearancesUpdated).toHaveLength(1))
    expect(backend.appearancesUpdated[0]).toEqual({
      id: 103,
      body: { matchId: 5, playerId: 3, isStarting: true, position: 'RB-4' },
    })
  })

  it('swaps a substitute with a starter, sending the starter to the bench', async () => {
    const { backend } = setup()
    await screen.findByText('Kowalski')

    drag(screen.getByText('Zieliński').closest('[draggable="true"]') as HTMLElement, slotOf('Nowak'))

    await waitFor(() => expect(backend.appearancesUpdated).toHaveLength(2))
    expect(backend.appearancesUpdated).toEqual([
      { id: 103, body: { matchId: 5, playerId: 3, isStarting: true, position: 'CB-2' } },
      { id: 102, body: { matchId: 5, playerId: 2, isStarting: false, position: null } },
    ])
  })

  it('does nothing when a player is dropped where they already are', async () => {
    const { backend } = setup()
    await screen.findByText('Kowalski')

    drag(slotOf('Nowak'), slotOf('Nowak'))
    drag(screen.getByText('Zieliński').closest('[draggable="true"]') as HTMLElement, benchZone())

    expect(backend.appearancesUpdated).toEqual([])
  })

  it('does not allow an analyst to drag players', async () => {
    setup({}, ANALYST)
    await screen.findByText('Kowalski')

    expect(screen.getByText('Nowak').closest('[draggable="true"]')).toBeNull()
  })

  it('reports a failed move', async () => {
    setup({ failOn: { updateAppearance: new Response(null, { status: 500 }) } })
    await screen.findByText('Kowalski')

    drag(slotOf('Nowak'), slotOf('LB'))

    expect(await screen.findByText('Nie udało się przenieść zawodnika.')).toBeInTheDocument()
  })
})

describe('match events', () => {
  const rowOf = (text: string) => screen.getByText(text).parentElement!.parentElement as HTMLElement

  it('groups events by half and extra time, in chronological order', async () => {
    setup({
      events: [
        event({ eventType: 'YellowCard', minute: 80, playerId: 3 }),
        event({ eventType: 'RedCard', minute: 105, playerId: 2 }),
        event({ eventType: 'YellowCard', minute: 20, playerId: 2 }),
        event({ eventType: 'Goal', minute: 5, playerId: 4 }),
      ],
    })

    expect(await screen.findByText('1. połowa')).toBeInTheDocument()
    expect(screen.getByText('2. połowa')).toBeInTheDocument()
    expect(screen.getByText('Dogrywka')).toBeInTheDocument()
    const labels = screen.getAllByText(/^\d+'/).map((el) => el.textContent)
    expect(labels).toEqual(["5' Marek Lewy", "20' Adam Nowak", "80' Piotr Zieliński", "105' Adam Nowak"])
  })

  it('shows the type of each event', async () => {
    setup({ events: [event({ eventType: 'Goal', minute: 5 }), event({ eventType: 'PenaltyGoal', minute: 6 }), event({ eventType: 'RedCard', minute: 7, playerId: 2 })] })
    await screen.findByText("5' Marek Lewy")

    expect(within(rowOf("5' Marek Lewy")).getByText('Gol')).toBeInTheDocument()
    expect(within(rowOf("6' Marek Lewy")).getByText('Gol z rzutu karnego')).toBeInTheDocument()
    expect(within(rowOf("7' Adam Nowak")).getByText('Czerwona kartka')).toBeInTheDocument()
  })

  it('combines a goal with its assist', async () => {
    setup({
      events: [event({ eventType: 'Goal', minute: 12, playerId: 4 }), event({ eventType: 'Assist', minute: 12, playerId: 3 })],
    })

    expect(await screen.findByText("12' Marek Lewy (asysta: Piotr Zieliński)")).toBeInTheDocument()
    expect(screen.queryByText('Asysta')).not.toBeInTheDocument()
  })

  it('combines the two halves of a substitution', async () => {
    setup({
      events: [
        event({ eventType: 'SubstitutionOff', minute: 60, playerId: 2 }),
        event({ eventType: 'SubstitutionIn', minute: 60, playerId: 3 }),
      ],
    })

    await screen.findByText("60' Adam Nowak ↓ / Piotr Zieliński ↑")
    expect(within(rowOf("60' Adam Nowak ↓ / Piotr Zieliński ↑")).getByText('Zmiana')).toBeInTheDocument()
  })

  it('marks a second yellow card', async () => {
    setup({
      events: [event({ eventType: 'YellowCard', minute: 20, playerId: 2 }), event({ eventType: 'YellowCard', minute: 70, playerId: 2 })],
    })

    await screen.findByText("70' Adam Nowak")
    expect(within(rowOf("20' Adam Nowak")).getByText('Żółta kartka')).toBeInTheDocument()
    expect(within(rowOf("70' Adam Nowak")).getByText('Druga żółta (czerwona)')).toBeInTheDocument()
  })

  it('shows opponent events with their name, or just "Rywal"', async () => {
    setup({
      events: [
        event({ eventType: 'Goal', team: 'Opponent', minute: 30, playerId: null, opponentPlayerName: 'Kowal' }),
        event({ eventType: 'YellowCard', team: 'Opponent', minute: 40, playerId: null, opponentPlayerName: null }),
      ],
    })

    expect(await screen.findByText("30' Kowal")).toBeInTheDocument()
    expect(within(rowOf("30' Kowal")).getByText('Gol (Rywal)')).toBeInTheDocument()
    expect(screen.getByText("40' Rywal")).toBeInTheDocument()
  })

  it('shows added time next to the minute', async () => {
    setup({ events: [event({ eventType: 'Goal', minute: 90, addedTime: 2, playerId: 4 })] })

    expect(await screen.findByText("90+2' Marek Lewy")).toBeInTheDocument()
  })

  it('names players it does not know', async () => {
    setup({ events: [event({ eventType: 'Goal', minute: 9, playerId: 999 })] })

    expect(await screen.findByText("9' Nieznany zawodnik")).toBeInTheDocument()
  })

  it('shows events without a minute at the end', async () => {
    setup({ events: [event({ eventType: 'Goal', minute: null, playerId: 4 }), event({ eventType: 'Goal', minute: 8, playerId: 3 })] })

    await screen.findByText("8' Piotr Zieliński")
    expect(screen.getByText("-' Marek Lewy")).toBeInTheDocument()
  })

  it('says so when there are no events', async () => {
    setup()

    expect(await screen.findByText('Brak zdarzeń.')).toBeInTheDocument()
  })

  it('shows notes and tactical boards instead of events for a planned match', async () => {
    setup({ match: plannedMatch() })

    expect(await screen.findByText('Notatki do meczu')).toBeInTheDocument()
    expect(screen.getByText('Taktyka')).toBeInTheDocument()
    expect(screen.queryByText('Zdarzenia meczowe')).not.toBeInTheDocument()
  })
})

describe('adding an event', () => {
  async function openDialog(user: ReturnType<typeof userEvent.setup>) {
    await screen.findByText('Brak zdarzeń.')
    await user.click(screen.getByRole('button', { name: 'Dodaj zdarzenie' }))
    return screen.getByRole('dialog')
  }

  async function chooseType(user: ReturnType<typeof userEvent.setup>, dialog: HTMLElement, label: string) {
    await user.click(within(dialog).getByRole('combobox', { name: /Typ zdarzenia/ }))
    await user.click(screen.getByRole('option', { name: label }))
  }

  async function choosePlayer(user: ReturnType<typeof userEvent.setup>, dialog: HTMLElement, field: RegExp, name: RegExp) {
    await user.click(within(dialog).getByRole('combobox', { name: field }))
    await user.click(screen.getByRole('option', { name }))
  }

  it('offers every event type', async () => {
    const { user } = setup()
    const dialog = await openDialog(user)

    await user.click(within(dialog).getByRole('combobox', { name: /Typ zdarzenia/ }))

    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Gol',
      'Samobój',
      'Żółta kartka',
      'Czerwona kartka',
      'Zmiana',
      'Niewykorzystany rzut karny',
    ])
  })

  it('offers only the players of the lineup', async () => {
    const { user } = setup()
    const dialog = await openDialog(user)

    await user.click(within(dialog).getByRole('combobox', { name: /Zawodnik/ }))

    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['JJan Kowalski', 'AAdam Nowak', 'PPiotr Zieliński'])
  })

  it('records a goal with an assist as two events', async () => {
    const { user, backend } = setup()
    const dialog = await openDialog(user)

    await chooseType(user, dialog, 'Gol')
    await choosePlayer(user, dialog, /Zawodnik/, /Adam Nowak/)
    await choosePlayer(user, dialog, /Asysta/, /Piotr Zieliński/)
    await user.type(within(dialog).getByLabelText('Minuta'), '12')
    await user.click(within(dialog).getByRole('button', { name: 'Dodaj' }))

    expect(await screen.findByText("12' Adam Nowak (asysta: Piotr Zieliński)")).toBeInTheDocument()
    expect(backend.eventsCreated).toEqual([
      { matchId: 5, eventType: 'Goal', team: 'Us', minute: 12, addedTime: null, playerId: 2, opponentPlayerName: null },
      { matchId: 5, eventType: 'Assist', team: 'Us', minute: 12, addedTime: null, playerId: 3, opponentPlayerName: null },
    ])
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('records a goal without an assist as one event', async () => {
    const { user, backend } = setup()
    const dialog = await openDialog(user)

    await chooseType(user, dialog, 'Gol')
    await choosePlayer(user, dialog, /Zawodnik/, /Adam Nowak/)
    await user.type(within(dialog).getByLabelText('Minuta'), '12')
    await user.click(within(dialog).getByRole('button', { name: 'Dodaj' }))

    await waitFor(() => expect(backend.eventsCreated).toHaveLength(1))
    expect(backend.eventsCreated[0]).toMatchObject({ eventType: 'Goal', playerId: 2 })
  })

  it('records a penalty as a penalty goal', async () => {
    const { user, backend } = setup()
    const dialog = await openDialog(user)

    await chooseType(user, dialog, 'Gol')
    await user.click(within(dialog).getByLabelText('Rzut karny'))
    await choosePlayer(user, dialog, /Zawodnik/, /Adam Nowak/)
    await user.click(within(dialog).getByRole('button', { name: 'Dodaj' }))

    await waitFor(() => expect(backend.eventsCreated).toHaveLength(1))
    expect(backend.eventsCreated[0]).toMatchObject({ eventType: 'PenaltyGoal' })
  })

  it('records an opponent goal with names instead of players', async () => {
    const { user, backend } = setup()
    const dialog = await openDialog(user)

    await user.click(within(dialog).getByRole('button', { name: 'Rywal' }))
    await chooseType(user, dialog, 'Gol')
    await user.type(within(dialog).getByLabelText('Nazwisko zawodnika rywala (opcjonalnie)'), 'Kowal')
    await user.type(within(dialog).getByLabelText('Asysta (rywal, opcjonalnie)'), 'Nowy')
    await user.type(within(dialog).getByLabelText('Minuta'), '33')
    await user.click(within(dialog).getByRole('button', { name: 'Dodaj' }))

    await waitFor(() => expect(backend.eventsCreated).toHaveLength(2))
    expect(backend.eventsCreated).toEqual([
      { matchId: 5, eventType: 'Goal', team: 'Opponent', minute: 33, addedTime: null, playerId: null, opponentPlayerName: 'Kowal' },
      { matchId: 5, eventType: 'Assist', team: 'Opponent', minute: 33, addedTime: null, playerId: null, opponentPlayerName: 'Nowy' },
    ])
  })

  it('records an opponent event without any name', async () => {
    const { user, backend } = setup()
    const dialog = await openDialog(user)

    await user.click(within(dialog).getByRole('button', { name: 'Rywal' }))
    await chooseType(user, dialog, 'Żółta kartka')
    await user.click(within(dialog).getByRole('button', { name: 'Dodaj' }))

    await waitFor(() => expect(backend.eventsCreated).toHaveLength(1))
    expect(backend.eventsCreated[0]).toMatchObject({ team: 'Opponent', playerId: null, opponentPlayerName: null, minute: null })
  })

  it('records a substitution as one player going off and one coming on', async () => {
    const { user, backend } = setup()
    const dialog = await openDialog(user)

    await chooseType(user, dialog, 'Zmiana')
    await choosePlayer(user, dialog, /Schodzi/, /Adam Nowak/)
    await choosePlayer(user, dialog, /Wchodzi/, /Piotr Zieliński/)
    await user.type(within(dialog).getByLabelText('Minuta'), '60')
    await user.click(within(dialog).getByRole('button', { name: 'Dodaj' }))

    await waitFor(() => expect(backend.eventsCreated).toHaveLength(2))
    expect(backend.eventsCreated).toEqual([
      { matchId: 5, eventType: 'SubstitutionOff', team: 'Us', minute: 60, addedTime: null, playerId: 2, opponentPlayerName: null },
      { matchId: 5, eventType: 'SubstitutionIn', team: 'Us', minute: 60, addedTime: null, playerId: 3, opponentPlayerName: null },
    ])
    expect(await screen.findByText("60' Adam Nowak ↓ / Piotr Zieliński ↑")).toBeInTheDocument()
  })

  it('allows added time only on stoppage minutes', async () => {
    const { user, backend } = setup()
    const dialog = await openDialog(user)
    await chooseType(user, dialog, 'Żółta kartka')
    await choosePlayer(user, dialog, /Zawodnik/, /Adam Nowak/)
    const added = within(dialog).getByLabelText('Doliczony czas (min)')
    expect(added).toBeDisabled()
    expect(within(dialog).getByText('Dostępne dla minut 45, 90, 105, 120')).toBeInTheDocument()

    await user.type(within(dialog).getByLabelText('Minuta'), '45')
    expect(added).toBeEnabled()
    await user.type(added, '3')
    await user.click(within(dialog).getByRole('button', { name: 'Dodaj' }))

    await waitFor(() => expect(backend.eventsCreated).toHaveLength(1))
    expect(backend.eventsCreated[0]).toMatchObject({ minute: 45, addedTime: 3 })
  })

  it('clears the added time when the minute is changed to a regular one', async () => {
    const { user, backend } = setup()
    const dialog = await openDialog(user)
    await chooseType(user, dialog, 'Żółta kartka')
    await choosePlayer(user, dialog, /Zawodnik/, /Adam Nowak/)

    await user.type(within(dialog).getByLabelText('Minuta'), '90')
    await user.type(within(dialog).getByLabelText('Doliczony czas (min)'), '2')
    await user.clear(within(dialog).getByLabelText('Minuta'))
    await user.type(within(dialog).getByLabelText('Minuta'), '30')

    expect(within(dialog).getByLabelText('Doliczony czas (min)')).toBeDisabled()
    expect(within(dialog).getByLabelText('Doliczony czas (min)')).toHaveValue(null)
    await user.click(within(dialog).getByRole('button', { name: 'Dodaj' }))
    await waitFor(() => expect(backend.eventsCreated).toHaveLength(1))
    expect(backend.eventsCreated[0]).toMatchObject({ minute: 30, addedTime: null })
  })

  it('requires a type and a player', async () => {
    const { user, backend } = setup()
    const dialog = await openDialog(user)

    await user.click(within(dialog).getByRole('button', { name: 'Dodaj' }))
    expect(backend.eventsCreated).toEqual([])

    await chooseType(user, dialog, 'Żółta kartka')
    await user.click(within(dialog).getByRole('button', { name: 'Dodaj' }))
    expect(backend.eventsCreated).toEqual([])
  })

  it('reports a failure and keeps the dialog', async () => {
    const { user } = setup({ failOn: { createEvent: new Response(null, { status: 500 }) } })
    const dialog = await openDialog(user)
    await chooseType(user, dialog, 'Żółta kartka')
    await choosePlayer(user, dialog, /Zawodnik/, /Adam Nowak/)

    await user.click(within(dialog).getByRole('button', { name: 'Dodaj' }))

    expect(await screen.findAllByText('Nie udało się dodać zdarzenia.')).not.toHaveLength(0)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('starts with an empty form every time', async () => {
    const { user } = setup()
    const dialog = await openDialog(user)
    await user.click(within(dialog).getByRole('button', { name: 'Rywal' }))
    await chooseType(user, dialog, 'Żółta kartka')
    await user.type(within(dialog).getByLabelText('Minuta'), '12')
    await user.click(within(dialog).getByRole('button', { name: 'Anuluj' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'Dodaj zdarzenie' }))

    const reopened = screen.getByRole('dialog')
    expect(within(reopened).getByRole('button', { name: 'Nasza drużyna' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(reopened).getByRole('combobox', { name: /Typ zdarzenia/ })).not.toHaveTextContent('Żółta')
    expect(within(reopened).getByLabelText('Minuta')).toHaveValue(null)
  })

  it('lets an assistant add events, but not an analyst', async () => {
    setup({}, ASSISTANT)
    expect(await screen.findByRole('button', { name: 'Dodaj zdarzenie' })).toBeInTheDocument()
  })

  it('hides adding events from an analyst', async () => {
    setup({}, ANALYST)
    await screen.findByText('Brak zdarzeń.')

    expect(screen.queryByRole('button', { name: 'Dodaj zdarzenie' })).not.toBeInTheDocument()
  })
})

describe('deleting an event', () => {
  const rowOf = (text: string) => screen.getByText(text).parentElement!.parentElement as HTMLElement

  it('deletes a single event', async () => {
    const { user, backend } = setup({ events: [event({ id: 31, eventType: 'YellowCard', minute: 20, playerId: 2 })] })
    await screen.findByText("20' Adam Nowak")

    await user.click(within(rowOf("20' Adam Nowak")).getByTestId('DeleteIcon'))

    await waitFor(() => expect(screen.queryByText("20' Adam Nowak")).not.toBeInTheDocument())
    expect(backend.eventsDeleted).toEqual([31])
  })

  it('deletes a goal together with its assist', async () => {
    const { user, backend } = setup({
      events: [
        event({ id: 41, eventType: 'Goal', minute: 12, playerId: 4 }),
        event({ id: 42, eventType: 'Assist', minute: 12, playerId: 3 }),
      ],
    })
    await screen.findByText("12' Marek Lewy (asysta: Piotr Zieliński)")

    await user.click(within(rowOf("12' Marek Lewy (asysta: Piotr Zieliński)")).getByTestId('DeleteIcon'))

    await waitFor(() => expect(backend.eventsDeleted.sort()).toEqual([41, 42]))
  })

  it('is reserved for the coach', async () => {
    setup({ events: [event({ eventType: 'Goal', minute: 12, playerId: 4 })] }, ASSISTANT)
    await screen.findByText("12' Marek Lewy")

    expect(screen.queryByTestId('DeleteIcon')).not.toBeInTheDocument()
  })

  it('reports a failed deletion', async () => {
    const { user } = setup({
      events: [event({ eventType: 'Goal', minute: 12, playerId: 4 })],
      failOn: { deleteEvent: new Response(null, { status: 500 }) },
    })
    await screen.findByText("12' Marek Lewy")

    await user.click(within(rowOf("12' Marek Lewy")).getByTestId('DeleteIcon'))

    expect(await screen.findByText('Nie udało się usunąć zdarzenia.')).toBeInTheDocument()
  })
})
