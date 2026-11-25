import { http, HttpResponse } from 'msw'
import { API, server } from '../mocks/server'

type Method = 'get' | 'post' | 'put' | 'delete'

export interface Captured {
  calls: number
  body: unknown
  url: URL | null
  headers: Headers | null
}

export function mockApi(method: Method, path: string, response?: unknown, status?: number): Captured {
  const captured: Captured = { calls: 0, body: undefined, url: null, headers: null }

  server.use(
    http[method](`${API}${path}`, async ({ request }) => {
      captured.calls += 1
      captured.url = new URL(request.url)
      captured.headers = request.headers

      const contentType = request.headers.get('content-type') ?? ''
      if (contentType.includes('application/json')) {
        captured.body = await request.json()
      } else if (contentType.includes('multipart/form-data')) {
        captured.body = await request.formData()
      }

      if (response === undefined) return new HttpResponse(null, { status: status ?? 204 })
      return HttpResponse.json(response, { status: status ?? 200 })
    }),
  )

  return captured
}
