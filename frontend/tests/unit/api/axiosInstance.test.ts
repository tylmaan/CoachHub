import { http, HttpResponse } from 'msw'
import { isAxiosError } from 'axios'
import axiosInstance, { BACKEND_ORIGIN } from '@/api/axiosInstance'
import { API, server } from '../../mocks/server'
import { mockApi } from '../../utils/mockApi'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('axiosInstance', () => {
  it('targets the /api prefix of the configured backend origin', () => {
    expect(BACKEND_ORIGIN).toBe('http://localhost:5006')
    expect(axiosInstance.defaults.baseURL).toBe('http://localhost:5006/api')
  })

  it('sends the stored token as a bearer header', async () => {
    localStorage.setItem('token', 'secret-token')
    const captured = mockApi('get', '/ping', { ok: true })

    await axiosInstance.get('/ping')

    expect(captured.headers?.get('authorization')).toBe('Bearer secret-token')
  })

  it('sends no authorization header when nobody is logged in', async () => {
    const captured = mockApi('get', '/ping', { ok: true })

    await axiosInstance.get('/ping')

    expect(captured.headers?.has('authorization')).toBe(false)
  })

  it('reads the token again on every request', async () => {
    const captured = mockApi('get', '/ping', { ok: true })

    localStorage.setItem('token', 'first')
    await axiosInstance.get('/ping')
    expect(captured.headers?.get('authorization')).toBe('Bearer first')

    localStorage.setItem('token', 'second')
    await axiosInstance.get('/ping')
    expect(captured.headers?.get('authorization')).toBe('Bearer second')

    localStorage.removeItem('token')
    await axiosInstance.get('/ping')
    expect(captured.headers?.has('authorization')).toBe(false)
  })

  it('rejects with the HTTP status for error responses', async () => {
    server.use(http.get(`${API}/secret`, () => new HttpResponse(null, { status: 401 })))

    const error = await axiosInstance.get('/secret').catch((e: unknown) => e)

    expect(isAxiosError(error)).toBe(true)
    expect(isAxiosError(error) && error.response?.status).toBe(401)
  })

  it('exposes the validation messages returned by the backend', async () => {
    server.use(http.post(`${API}/teams`, () => HttpResponse.json(['Nieprawidłowy kod kraju.'], { status: 400 })))

    const error = await axiosInstance.post('/teams', {}).catch((e: unknown) => e)

    expect(isAxiosError(error) && error.response?.data).toEqual(['Nieprawidłowy kod kraju.'])
  })

  describe('backend origin configuration', () => {
    it('uses VITE_BACKEND_ORIGIN when it is set', async () => {
      vi.stubEnv('VITE_BACKEND_ORIGIN', 'https://api.example.com')
      vi.resetModules()

      const module = await import('@/api/axiosInstance')

      expect(module.BACKEND_ORIGIN).toBe('https://api.example.com')
      expect(module.default.defaults.baseURL).toBe('https://api.example.com/api')
    })

    it('defaults to port 5006 of the current host when it is not set', async () => {
      vi.stubEnv('VITE_BACKEND_ORIGIN', undefined)
      vi.resetModules()

      const module = await import('@/api/axiosInstance')

      expect(module.BACKEND_ORIGIN).toBe(`http://${window.location.hostname}:5006`)
    })

    it('uses a relative /api when it is set to an empty string (dev proxy)', async () => {
      vi.stubEnv('VITE_BACKEND_ORIGIN', '')
      vi.resetModules()

      const module = await import('@/api/axiosInstance')

      expect(module.BACKEND_ORIGIN).toBe('')
      expect(module.default.defaults.baseURL).toBe('/api')
    })
  })
})
