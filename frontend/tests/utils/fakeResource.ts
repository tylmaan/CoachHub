import { http, HttpResponse } from 'msw'
import { API, server } from '../mocks/server'

type Operation = 'list' | 'create' | 'update' | 'delete' | 'upload'

export interface FakeResource<T> {
  list: () => T[]
  created: unknown[]
  updated: Array<{ id: string | number; body: unknown }>
  deleted: Array<string | number>
  uploads: number
}

interface Options {
  createPath?: string
  failOn?: Partial<Record<Operation, Response>>
  make?: (body: Record<string, unknown>, id: number) => unknown
}

export function fakeResource<T extends { id: number | string }>(
  path: string,
  initial: T[],
  { createPath = path, failOn = {}, make }: Options = {},
): FakeResource<T> {
  let items = initial.map((item) => ({ ...item }))
  let nextId = 1000
  const state: FakeResource<T> = { list: () => items, created: [], updated: [], deleted: [], uploads: 0 }

  const failing = (operation: Operation) => failOn[operation]?.clone() ?? null
  const sameId = (item: T, id: string | readonly string[] | undefined) => String(item.id) === String(id)

  server.use(
    http.get(`${API}${path}`, () => failing('list') ?? HttpResponse.json(items)),
    http.post(`${API}${createPath}`, async ({ request }) => {
      const failure = failing('create')
      if (failure) return failure
      const body = (await request.json()) as Record<string, unknown>
      state.created.push(body)
      const entity = (make ? make(body, nextId) : { ...body, id: nextId }) as T
      nextId += 1
      items = [...items, entity]
      return HttpResponse.json(entity, { status: 201 })
    }),
    http.put(`${API}${path}/:id`, async ({ request, params }) => {
      const failure = failing('update')
      if (failure) return failure
      const body = (await request.json()) as Record<string, unknown>
      state.updated.push({ id: params.id as string, body })
      items = items.map((item) => (sameId(item, params.id) ? { ...item, ...body } : item))
      return new HttpResponse(null, { status: 204 })
    }),
    http.delete(`${API}${path}/:id`, ({ params }) => {
      const failure = failing('delete')
      if (failure) return failure
      state.deleted.push(params.id as string)
      items = items.filter((item) => !sameId(item, params.id))
      return new HttpResponse(null, { status: 204 })
    }),
    http.post(`${API}/files/upload`, () => {
      state.uploads += 1
      return failing('upload') ?? HttpResponse.json({ url: '/uploads/new-photo.png' })
    }),
  )

  return state
}
