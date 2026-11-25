import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { API, server } from '../mocks/server'
import { makeTeam } from '../utils/factories'
import { mockApi } from '../utils/mockApi'
import { renderApp } from '../utils/renderApp'

const auth = { token: 'new-jwt', email: 'coach@test.local', roles: ['Coach'], teamId: 1 }

function mockDashboardData() {
  mockApi('get', '/teams', [{ ...makeTeam({ id: 1, name: 'Cracovia' }), staffMembers: [] }])
  mockApi('get', '/matches', [])
}

async function fillAndSubmit(email: string, password: string) {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(/Email/), email)
  await user.type(screen.getByLabelText(/Hasło/), password)
  await user.click(screen.getByRole('button', { name: 'Zaloguj się' }))
}

describe('login flow', () => {
  it('sends anonymous visitors to the login form', async () => {
    renderApp('/', null)

    expect(await screen.findByRole('button', { name: 'Zaloguj się' })).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Hasło/)).toBeInTheDocument()
  })

  it('protects every page, not only the dashboard', async () => {
    renderApp('/players', null)

    expect(await screen.findByRole('button', { name: 'Zaloguj się' })).toBeInTheDocument()
  })

  it('logs in, stores the session and opens the dashboard', async () => {
    const login = mockApi('post', '/auth/login', auth)
    mockDashboardData()
    renderApp('/login', null)

    await fillAndSubmit('coach@test.local', 'Passw0rd!')

    expect(await screen.findByText('Cracovia')).toBeInTheDocument()
    expect(login.body).toEqual({ email: 'coach@test.local', password: 'Passw0rd!' })
    expect(localStorage.getItem('token')).toBe('new-jwt')
    expect(localStorage.getItem('email')).toBe('coach@test.local')
    expect(localStorage.getItem('roles')).toBe('["Coach"]')
    expect(localStorage.getItem('teamId')).toBe('1')
    expect(screen.getByText('coach@test.local')).toBeInTheDocument()
  })

  it('sends the new token with the requests made after logging in', async () => {
    mockApi('post', '/auth/login', auth)
    const teams = mockApi('get', '/teams', [{ ...makeTeam({ id: 1 }), staffMembers: [] }])
    mockApi('get', '/matches', [])
    renderApp('/login', null)

    await fillAndSubmit('coach@test.local', 'Passw0rd!')

    await waitFor(() => expect(teams.calls).toBe(1))
    expect(teams.headers?.get('authorization')).toBe('Bearer new-jwt')
  })

  it('shows an error and stays on the form when the credentials are wrong', async () => {
    server.use(http.post(`${API}/auth/login`, () => new HttpResponse(null, { status: 401 })))
    renderApp('/login', null)

    await fillAndSubmit('coach@test.local', 'wrong')

    expect(await screen.findByText('Nieprawidłowy email lub hasło')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Zaloguj się' })).toBeInTheDocument()
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('shows the same error when the server is unreachable', async () => {
    server.use(http.post(`${API}/auth/login`, () => HttpResponse.error()))
    renderApp('/login', null)

    await fillAndSubmit('coach@test.local', 'Passw0rd!')

    expect(await screen.findByText('Nieprawidłowy email lub hasło')).toBeInTheDocument()
  })

  it('clears the error on the next attempt and lets the user in', async () => {
    let attempts = 0
    server.use(
      http.post(`${API}/auth/login`, () => {
        attempts += 1
        return attempts === 1 ? new HttpResponse(null, { status: 401 }) : HttpResponse.json(auth)
      }),
    )
    mockDashboardData()
    renderApp('/login', null)
    await fillAndSubmit('coach@test.local', 'wrong')
    await screen.findByText('Nieprawidłowy email lub hasło')

    const user = userEvent.setup()
    await user.clear(screen.getByLabelText(/Hasło/))
    await user.type(screen.getByLabelText(/Hasło/), 'Passw0rd!')
    await user.click(screen.getByRole('button', { name: 'Zaloguj się' }))

    expect(await screen.findByText('Cracovia')).toBeInTheDocument()
    expect(screen.queryByText('Nieprawidłowy email lub hasło')).not.toBeInTheDocument()
  })

  it('does not send a request while the fields are empty', async () => {
    const login = mockApi('post', '/auth/login', auth)
    renderApp('/login', null)

    await userEvent.setup().click(screen.getByRole('button', { name: 'Zaloguj się' }))

    expect(login.calls).toBe(0)
  })

  it('logs out from the layout and returns to the login form', async () => {
    mockDashboardData()
    renderApp('/')
    await screen.findByText('Cracovia')

    await userEvent.setup().click(screen.getByLabelText('Wyloguj się'))

    expect(await screen.findByRole('button', { name: 'Zaloguj się' })).toBeInTheDocument()
    expect(localStorage.getItem('token')).toBeNull()
  })
})
