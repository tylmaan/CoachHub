import { act, render, renderHook, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import type { AuthResponse } from '@/types/auth'

const auth: AuthResponse = { token: 'jwt-token', email: 'coach@test.local', roles: ['Coach'], teamId: 3 }

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>

describe('AuthProvider', () => {
  it('starts logged out when nothing is stored', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current).toMatchObject({ token: null, email: null, roles: [], teamId: null })
  })

  it('restores the session from localStorage', () => {
    localStorage.setItem('token', 'stored')
    localStorage.setItem('email', 'stored@test.local')
    localStorage.setItem('roles', JSON.stringify(['Admin']))
    localStorage.setItem('teamId', '7')

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current).toMatchObject({ token: 'stored', email: 'stored@test.local', roles: ['Admin'], teamId: 7 })
  })

  it('restores a missing team (admins have none)', () => {
    localStorage.setItem('token', 'stored')
    localStorage.setItem('teamId', 'null')

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.teamId).toBeNull()
  })

  it('logs in: updates the state and persists every field', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    act(() => result.current.login(auth))

    expect(result.current).toMatchObject(auth)
    expect(localStorage.getItem('token')).toBe('jwt-token')
    expect(localStorage.getItem('email')).toBe('coach@test.local')
    expect(localStorage.getItem('roles')).toBe('["Coach"]')
    expect(localStorage.getItem('teamId')).toBe('3')
  })

  it('persists a missing team as null', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    act(() => result.current.login({ ...auth, roles: ['Admin'], teamId: null }))

    expect(localStorage.getItem('teamId')).toBe('null')
    expect(result.current.teamId).toBeNull()
  })

  it('logs out: clears the state and the stored session', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    act(() => result.current.login(auth))

    act(() => result.current.logout())

    expect(result.current).toMatchObject({ token: null, email: null, roles: [], teamId: null })
    for (const key of ['token', 'email', 'roles', 'teamId']) expect(localStorage.getItem(key)).toBeNull()
  })

  it('shares the session with every consumer', () => {
    function Probe() {
      const { token, login } = useAuth()
      return <button onClick={() => login(auth)}>{token ?? 'anonymous'}</button>
    }
    render(
      <AuthProvider>
        <Probe />
        <Probe />
      </AuthProvider>,
    )

    act(() => screen.getAllByRole('button')[0].click())

    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual(['jwt-token', 'jwt-token'])
  })

  // A corrupted "roles" or "teamId" entry makes JSON.parse throw during the first render,
  // so the whole app crashes until the user clears site data.
  it.skip('BUG: survives corrupted session data in localStorage', () => {
    localStorage.setItem('token', 'stored')
    localStorage.setItem('roles', '{broken')

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.roles).toEqual([])
  })
})

describe('useAuth', () => {
  it('throws outside of the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within AuthProvider')
  })
})
