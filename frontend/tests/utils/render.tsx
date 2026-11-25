import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import type { AuthResponse } from '@/types/auth'

export interface RenderOptions {
  route?: string
  auth?: Partial<AuthResponse>
}

export function seedAuth(auth: Partial<AuthResponse> = {}) {
  const full: AuthResponse = { token: 'test-token', email: 'coach@test.local', roles: ['Coach'], teamId: 1, ...auth }
  localStorage.setItem('token', full.token)
  localStorage.setItem('email', full.email)
  localStorage.setItem('roles', JSON.stringify(full.roles))
  localStorage.setItem('teamId', JSON.stringify(full.teamId))
}

export function renderWithProviders(ui: ReactElement, { route = '/', auth }: RenderOptions = {}) {
  if (auth) seedAuth(auth)

  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>,
  )
}
