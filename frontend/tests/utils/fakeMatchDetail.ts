import { http, HttpResponse } from 'msw'
import type { Match } from '@/types/match'
import type { MatchAppearance } from '@/types/matchAppearance'
import type { MatchEvent } from '@/types/matchEvent'
import type { Player } from '@/types/player'
import type { TeamSummary } from '@/types/team'
import { API, server } from '../mocks/server'

type AppearanceBody = Omit<MatchAppearance, 'id'>
type EventBody = Omit<MatchEvent, 'id'>

export interface FakeMatchDetail {
  match: () => Match
  appearances: () => MatchAppearance[]
  events: () => MatchEvent[]
  matchUpdates: Array<Partial<Match>>
  appearancesCreated: AppearanceBody[]
  appearancesUpdated: Array<{ id: number; body: AppearanceBody }>
  appearancesDeleted: number[]
  eventsCreated: EventBody[]
  eventsDeleted: number[]
  notes: Array<{ field: 'game-plan' | 'opponent-notes'; text: string | null }>
}

type Operation =
  | 'match'
  | 'updateMatch'
  | 'createAppearance'
  | 'updateAppearance'
  | 'deleteAppearance'
  | 'createEvent'
  | 'deleteEvent'

interface Input {
  match: Match
  players?: Player[]
  appearances?: MatchAppearance[]
  events?: MatchEvent[]
  team?: TeamSummary | null
  failOn?: Partial<Record<Operation, Response>>
}

export function fakeMatchDetail({ match, players = [], appearances = [], events = [], team = null, failOn = {} }: Input): FakeMatchDetail {
  let currentMatch = { ...match }
  let currentAppearances = appearances.map((a) => ({ ...a }))
  let currentEvents = events.map((e) => ({ ...e }))
  let nextAppearanceId = 900
  let nextEventId = 900

  const state: FakeMatchDetail = {
    match: () => currentMatch,
    appearances: () => currentAppearances,
    events: () => currentEvents,
    matchUpdates: [],
    appearancesCreated: [],
    appearancesUpdated: [],
    appearancesDeleted: [],
    eventsCreated: [],
    eventsDeleted: [],
    notes: [],
  }

  const failing = (operation: Operation) => failOn[operation]?.clone() ?? null
  const idOf = (value: string | readonly string[] | undefined) => Number(value)

  server.use(
    http.get(`${API}/matches/:id`, ({ params }) => {
      const failure = failing('match')
      if (failure) return failure
      return idOf(params.id) === currentMatch.id ? HttpResponse.json(currentMatch) : new HttpResponse(null, { status: 404 })
    }),
    http.put(`${API}/matches/:id`, async ({ request }) => {
      const failure = failing('updateMatch')
      if (failure) return failure
      const body = (await request.json()) as Partial<Match>
      state.matchUpdates.push(body)
      currentMatch = { ...currentMatch, ...body, id: currentMatch.id }
      return new HttpResponse(null, { status: 204 })
    }),
    http.put(`${API}/matches/:id/game-plan`, async ({ request }) => {
      const { text } = (await request.json()) as { text: string | null }
      state.notes.push({ field: 'game-plan', text })
      return new HttpResponse(null, { status: 204 })
    }),
    http.put(`${API}/matches/:id/opponent-notes`, async ({ request }) => {
      const { text } = (await request.json()) as { text: string | null }
      state.notes.push({ field: 'opponent-notes', text })
      return new HttpResponse(null, { status: 204 })
    }),
    http.get(`${API}/players`, () => HttpResponse.json(players)),
    http.get(`${API}/teams`, () => HttpResponse.json(team ? [team] : [])),
    http.get(`${API}/tacticalschemes/match/:id`, () => HttpResponse.json([])),
    http.get(`${API}/matchappearances/match/:id`, () => HttpResponse.json(currentAppearances)),
    http.post(`${API}/matchappearances`, async ({ request }) => {
      const failure = failing('createAppearance')
      if (failure) return failure
      const body = (await request.json()) as AppearanceBody
      state.appearancesCreated.push(body)
      const created = { ...body, id: nextAppearanceId++ }
      currentAppearances = [...currentAppearances, created]
      return HttpResponse.json(created, { status: 201 })
    }),
    http.put(`${API}/matchappearances/:id`, async ({ request, params }) => {
      const failure = failing('updateAppearance')
      if (failure) return failure
      const body = (await request.json()) as AppearanceBody
      state.appearancesUpdated.push({ id: idOf(params.id), body })
      currentAppearances = currentAppearances.map((a) => (a.id === idOf(params.id) ? { ...a, ...body } : a))
      return new HttpResponse(null, { status: 204 })
    }),
    http.delete(`${API}/matchappearances/:id`, ({ params }) => {
      const failure = failing('deleteAppearance')
      if (failure) return failure
      state.appearancesDeleted.push(idOf(params.id))
      currentAppearances = currentAppearances.filter((a) => a.id !== idOf(params.id))
      return new HttpResponse(null, { status: 204 })
    }),
    http.get(`${API}/matchevents/match/:id`, () => HttpResponse.json(currentEvents)),
    http.post(`${API}/matchevents`, async ({ request }) => {
      const failure = failing('createEvent')
      if (failure) return failure
      const body = (await request.json()) as EventBody
      state.eventsCreated.push(body)
      const created = { ...body, id: nextEventId++ }
      currentEvents = [...currentEvents, created]
      return HttpResponse.json(created, { status: 201 })
    }),
    http.delete(`${API}/matchevents/:id`, ({ params }) => {
      const failure = failing('deleteEvent')
      if (failure) return failure
      state.eventsDeleted.push(idOf(params.id))
      currentEvents = currentEvents.filter((e) => e.id !== idOf(params.id))
      return new HttpResponse(null, { status: 204 })
    }),
  )

  return state
}
