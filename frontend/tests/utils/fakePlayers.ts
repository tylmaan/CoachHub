import { http, HttpResponse } from 'msw'
import type { Player, PlayerDeletionImpact } from '@/types/player'
import { API, server } from '../mocks/server'

type PlayerBody = Omit<Player, 'id' | 'archivedAt'>

export interface FakePlayers {
  list: () => Player[]
  created: PlayerBody[]
  updated: Array<{ id: number; body: PlayerBody }>
  deleted: number[]
  archived: number[]
  restored: number[]
  impactCalls: number[]
  uploads: number
}

interface Options {
  impact?: Record<number, PlayerDeletionImpact>
  failOn?: Partial<Record<'list' | 'create' | 'update' | 'delete' | 'archive' | 'restore' | 'impact' | 'upload', Response>>
}

export function fakePlayers(initial: Player[], { impact = {}, failOn = {} }: Options = {}): FakePlayers {
  let players = initial.map((p) => ({ ...p }))
  let nextId = Math.max(0, ...players.map((p) => p.id)) + 1
  const state: FakePlayers = {
    list: () => players,
    created: [],
    updated: [],
    deleted: [],
    archived: [],
    restored: [],
    impactCalls: [],
    uploads: 0,
  }

  const failing = (key: keyof NonNullable<Options['failOn']>) => failOn[key]?.clone() ?? null
  const idOf = (params: Record<string, string | readonly string[] | undefined>) => Number(params.id)

  server.use(
    http.get(`${API}/players`, () => failing('list') ?? HttpResponse.json(players)),
    http.post(`${API}/players`, async ({ request }) => {
      const failure = failing('create')
      if (failure) return failure
      const body = (await request.json()) as PlayerBody
      state.created.push(body)
      const player: Player = { ...body, id: nextId++, archivedAt: null }
      players = [...players, player]
      return HttpResponse.json(player, { status: 201 })
    }),
    http.put(`${API}/players/:id`, async ({ request, params }) => {
      const failure = failing('update')
      if (failure) return failure
      const body = (await request.json()) as PlayerBody
      state.updated.push({ id: idOf(params), body })
      players = players.map((p) => (p.id === idOf(params) ? { ...p, ...body } : p))
      return new HttpResponse(null, { status: 204 })
    }),
    http.delete(`${API}/players/:id`, ({ params }) => {
      const failure = failing('delete')
      if (failure) return failure
      state.deleted.push(idOf(params))
      players = players.filter((p) => p.id !== idOf(params))
      return new HttpResponse(null, { status: 204 })
    }),
    http.post(`${API}/players/:id/archive`, ({ params }) => {
      const failure = failing('archive')
      if (failure) return failure
      state.archived.push(idOf(params))
      players = players.map((p) => (p.id === idOf(params) ? { ...p, archivedAt: '2025-06-15' } : p))
      return new HttpResponse(null, { status: 204 })
    }),
    http.post(`${API}/players/:id/restore`, ({ params }) => {
      const failure = failing('restore')
      if (failure) return failure
      state.restored.push(idOf(params))
      players = players.map((p) => (p.id === idOf(params) ? { ...p, archivedAt: null } : p))
      return new HttpResponse(null, { status: 204 })
    }),
    http.get(`${API}/players/:id/deletion-impact`, ({ params }) => {
      state.impactCalls.push(idOf(params))
      const failure = failing('impact')
      if (failure) return failure
      return HttpResponse.json(impact[idOf(params)] ?? { appearances: 0, events: 0, reports: 0 })
    }),
    http.post(`${API}/files/upload`, () => {
      state.uploads += 1
      return failing('upload') ?? HttpResponse.json({ url: '/uploads/new-photo.png' })
    }),
  )

  return state
}
