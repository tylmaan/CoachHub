import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Logo } from '@/components/Logo'
import { Pitch } from '@/components/Pitch'
import { renderWithProviders, type RenderOptions } from '../../utils/render'

function renderLayout(route: string, auth: RenderOptions['auth'] = {}) {
  return renderWithProviders(
    <Routes>
      <Route element={<Layout />}>
        <Route path="*" element={<div>page content</div>} />
      </Route>
    </Routes>,
    { route, auth },
  )
}

describe('Layout', () => {
  it('renders the current page inside the layout', () => {
    renderLayout('/players')

    expect(screen.getByText('page content')).toBeInTheDocument()
  })

  it('shows the e-mail of the logged-in user', () => {
    renderLayout('/', { email: 'trener@test.local' })

    expect(screen.getByText('trener@test.local')).toBeInTheDocument()
  })

  it('shows every role of the user in Polish, passing unknown roles through', () => {
    renderLayout('/', { roles: ['Admin', 'Coach', 'Mystery'] })

    expect(screen.getByText('Administrator')).toBeInTheDocument()
    expect(screen.getByText('Trener')).toBeInTheDocument()
    expect(screen.getByText('Mystery')).toBeInTheDocument()
  })

  it('links the logo to the dashboard', () => {
    renderLayout('/players')

    expect(screen.getByRole('link', { name: /CoachHub/ })).toHaveAttribute('href', '/')
  })

  it.each([
    ['/', 'Dashboard'],
    ['/teams', 'Drużyny'],
    ['/players', 'Zawodnicy'],
    ['/matches', 'Mecze'],
    ['/users', 'Użytkownicy'],
    ['/stats', 'Statystyki'],
    ['/stats/players', 'Statystyki zawodników'],
    ['/reports', 'Raporty'],
  ])('shows the title of %s', (route, title) => {
    renderLayout(route)

    expect(screen.getByText(title)).toBeInTheDocument()
  })

  it('shows no page title on detail pages', () => {
    renderLayout('/matches/5')

    expect(screen.queryByText('Mecze')).not.toBeInTheDocument()
  })

  describe('back button', () => {
    it('is hidden on the dashboard', () => {
      renderLayout('/')

      expect(screen.queryByRole('link', { name: 'Wróć' })).not.toBeInTheDocument()
    })

    it.each([
      ['/players', '/'],
      ['/matches', '/'],
      ['/matches/5', '/matches'],
      ['/stats', '/'],
      ['/stats/players', '/stats'],
      ['/reports', '/'],
      ['/reports/3', '/reports'],
    ])('on %s goes to %s', (route, parent) => {
      renderLayout(route)

      expect(screen.getByRole('link', { name: 'Wróć' })).toHaveAttribute('href', parent)
    })
  })

  describe('logout', () => {
    const desktopButton = () => screen.getByText('Wyloguj się')
    const mobileButton = () => screen.getByLabelText('Wyloguj się')

    it('offers a logout button for desktop and for mobile', () => {
      renderLayout('/')

      expect(desktopButton()).toBeInTheDocument()
      expect(mobileButton()).toBeInTheDocument()
    })

    it.each([
      ['desktop', desktopButton],
      ['mobile', mobileButton],
    ])('ends the session with the %s button', async (_name, button) => {
      const user = userEvent.setup()
      renderLayout('/', { token: 'jwt' })

      await user.click(button())

      expect(localStorage.getItem('token')).toBeNull()
      expect(screen.queryByText('coach@test.local')).not.toBeInTheDocument()
    })
  })
})

describe('Logo', () => {
  it('is an accessible image named CoachHub', () => {
    render32()

    expect(screen.getByRole('img', { name: 'CoachHub' })).toHaveAttribute('width', '32')
  })

  it('honours the size', () => {
    renderWithProviders(<Logo size={64} />)

    expect(screen.getByRole('img', { name: 'CoachHub' })).toHaveAttribute('height', '64')
  })

  function render32() {
    renderWithProviders(<Logo />)
  }
})

describe('Pitch', () => {
  it('renders its children on top of the pitch', () => {
    renderWithProviders(
      <Pitch>
        <span>player marker</span>
      </Pitch>,
    )

    expect(screen.getByText('player marker')).toBeInTheDocument()
  })

  it('renders without children', () => {
    const { container } = renderWithProviders(<Pitch aspectRatio="68 / 105" />)

    expect(container.firstElementChild).not.toBeNull()
  })
})
