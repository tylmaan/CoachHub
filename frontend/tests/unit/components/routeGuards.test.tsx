import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { AdminRoute } from '@/components/AdminRoute'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { renderWithProviders, type RenderOptions } from '../../utils/render'

describe('ProtectedRoute', () => {
  function renderAt(route: string, auth?: RenderOptions['auth']) {
    return renderWithProviders(
      <Routes>
        <Route path="/login" element={<div>login page</div>} />
        <Route
          path="/secret"
          element={
            <ProtectedRoute>
              <div>secret content</div>
            </ProtectedRoute>
          }
        />
      </Routes>,
      { route, auth },
    )
  }

  it('renders the page for a logged-in user', () => {
    renderAt('/secret', { token: 'jwt' })

    expect(screen.getByText('secret content')).toBeInTheDocument()
  })

  it('redirects anonymous visitors to the login page', () => {
    renderAt('/secret')

    expect(screen.getByText('login page')).toBeInTheDocument()
    expect(screen.queryByText('secret content')).not.toBeInTheDocument()
  })

  it('treats an empty token as logged out', () => {
    renderAt('/secret', { token: '' })

    expect(screen.getByText('login page')).toBeInTheDocument()
  })
})

describe('AdminRoute', () => {
  function renderAt(auth?: RenderOptions['auth']) {
    return renderWithProviders(
      <Routes>
        <Route path="/" element={<div>home page</div>} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <div>admin content</div>
            </AdminRoute>
          }
        />
      </Routes>,
      { route: '/admin', auth },
    )
  }

  it('renders the page for an administrator', () => {
    renderAt({ roles: ['Admin'], teamId: null })

    expect(screen.getByText('admin content')).toBeInTheDocument()
  })

  it.each([['Coach'], ['AssistantCoach'], ['Analyst']])('sends a %s home', (role) => {
    renderAt({ roles: [role] })

    expect(screen.getByText('home page')).toBeInTheDocument()
    expect(screen.queryByText('admin content')).not.toBeInTheDocument()
  })

  it('sends users without roles home', () => {
    renderAt({ roles: [] })

    expect(screen.getByText('home page')).toBeInTheDocument()
  })

  it('lets a user with several roles in when one of them is Admin', () => {
    renderAt({ roles: ['Coach', 'Admin'] })

    expect(screen.getByText('admin content')).toBeInTheDocument()
  })
})
