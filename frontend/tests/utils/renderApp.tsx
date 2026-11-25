import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '@/App'
import { AuthProvider } from '@/context/AuthContext'
import type { AuthResponse } from '@/types/auth'
import { seedAuth } from './render'

export const COACH: Partial<AuthResponse> = { token: 'coach-token', email: 'coach@test.local', roles: ['Coach'], teamId: 1 }
export const ASSISTANT: Partial<AuthResponse> = { token: 'assistant-token', email: 'assistant@test.local', roles: ['AssistantCoach'], teamId: 1 }
export const ANALYST: Partial<AuthResponse> = { token: 'analyst-token', email: 'analyst@test.local', roles: ['Analyst'], teamId: 1 }
export const ADMIN: Partial<AuthResponse> = { token: 'admin-token', email: 'admin@test.local', roles: ['Admin'], teamId: null }

export function renderApp(route = '/', auth: Partial<AuthResponse> | null = COACH) {
  if (auth) seedAuth(auth)

  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  )
}
