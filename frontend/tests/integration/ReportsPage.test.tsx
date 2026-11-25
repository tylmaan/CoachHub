import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import type { Report, ReportPage } from '@/types/report'
import { API, server } from '../mocks/server'
import { makeMatch, makePlayer, makeReport } from '../utils/factories'
import { mockApi } from '../utils/mockApi'
import { ANALYST, COACH, renderApp } from '../utils/renderApp'

type PageFor = (params: URLSearchParams) => Partial<ReportPage>

function mockReports(pageFor: PageFor = () => ({})) {
  const requests: URLSearchParams[] = []
  server.use(
    http.get(`${API}/reports`, ({ request }) => {
      const params = new URL(request.url).searchParams
      requests.push(params)
      const page: ReportPage = { items: [], hasMore: false, unreadCount: 0, authors: [], ...pageFor(params) }
      return HttpResponse.json(page)
    }),
  )
  return requests
}

const reports = (n: number): Report[] =>
  Array.from({ length: n }, (_, i) =>
    makeReport({ id: i + 1, title: `Report ${i + 1}`, teamName: 'Cracovia', authorName: 'Anna Kowalska', authorId: 'a1' }),
  )

const authors = [
  { id: 'a1', name: 'Anna Kowalska' },
  { id: 'a2', name: 'Bartek Nowak' },
]

function setup(pageFor?: PageFor, auth = COACH) {
  const requests = mockReports(pageFor)
  renderApp('/reports', auth)
  return { requests, user: userEvent.setup({ delay: null }) }
}

const lastRequest = (requests: URLSearchParams[]) => requests[requests.length - 1]

describe('reports list', () => {
  it('shows a tile for every report with the count', async () => {
    setup(() => ({ items: reports(3) }))

    expect(await screen.findByText('Report 1')).toBeInTheDocument()
    expect(screen.getByText('Report 3')).toBeInTheDocument()
    expect(screen.getByText('3 raporty z ostatnich 30 dni')).toBeInTheDocument()
  })

  it('loads the last 30 days with no filters at first', async () => {
    const { requests } = setup(() => ({ items: reports(1) }))
    await screen.findByText('Report 1')

    const params = requests[0]
    expect(params.get('days')).toBe('30')
    expect(params.getAll('kinds')).toEqual([])
    expect(params.getAll('authors')).toEqual([])
    expect(params.get('unreadOnly')).toBe('false')
    expect(params.get('highPriorityOnly')).toBe('false')
    expect(params.has('search')).toBe(false)
  })

  it.each([
    [0, '0 raportów'],
    [1, '1 raport'],
    [2, '2 raporty'],
    [4, '4 raporty'],
    [5, '5 raportów'],
    [11, '11 raportów'],
    [12, '12 raportów'],
    [14, '14 raportów'],
    [22, '22 raporty'],
    [25, '25 raportów'],
  ])('uses the right Polish plural for %i reports', async (count, label) => {
    setup(() => ({ items: reports(count) }))

    expect(await screen.findByText(`${label} z ostatnich 30 dni`)).toBeInTheDocument()
  })

  it('shows the number of unread reports', async () => {
    setup(() => ({ items: reports(2), unreadCount: 3 }))

    expect(await screen.findByText('3 nieprzeczytane')).toBeInTheDocument()
  })

  it('hides the unread counter when everything is read', async () => {
    setup(() => ({ items: reports(2), unreadCount: 0 }))
    await screen.findByText('Report 1')

    expect(screen.queryByText(/nieprzeczytane$/)).not.toBeInTheDocument()
  })

  it('says there are no reports yet', async () => {
    setup()

    expect(await screen.findByText('Nie ma jeszcze żadnych raportów.')).toBeInTheDocument()
  })

  it('says there are no recent reports when older ones exist', async () => {
    setup(() => ({ hasMore: true }))

    expect(await screen.findByText('Brak raportów z ostatnich 30 dni.')).toBeInTheDocument()
  })

  it('shows an error when the reports cannot be loaded', async () => {
    server.use(http.get(`${API}/reports`, () => new HttpResponse(null, { status: 500 })))
    renderApp('/reports', COACH)

    expect(await screen.findByText('Nie udało się pobrać raportów.')).toBeInTheDocument()
  })

  it('keeps the list and shows an error when a refresh fails', async () => {
    let fail = false
    server.use(
      http.get(`${API}/reports`, () =>
        fail ? new HttpResponse(null, { status: 500 }) : HttpResponse.json({ items: reports(2), hasMore: false, unreadCount: 0, authors }),
      ),
    )
    renderApp('/reports', COACH)
    await screen.findByText('Report 1')
    fail = true

    await userEvent.setup({ delay: null }).click(screen.getByRole('button', { name: 'Wysoki priorytet' }))

    expect(await screen.findByText('Nie udało się pobrać raportów.')).toBeInTheDocument()
    expect(screen.getByText('Report 1')).toBeInTheDocument()
  })

  it('opens a report when its tile is clicked', async () => {
    mockApi('get', '/reports/2', makeReport({ id: 2, title: 'Report 2', teamName: 'Cracovia' }))
    mockApi('get', '/tacticalschemes/report/2', [])
    const { user } = setup(() => ({ items: reports(3) }))

    await user.click(await screen.findByText('Report 2'))

    expect(await screen.findByLabelText('Wróć')).toHaveAttribute('href', '/reports')
    expect(await screen.findByText('Tablice taktyczne')).toBeInTheDocument()
  })
})

describe('filters', () => {
  it('filters by kind, combining several kinds', async () => {
    const { requests, user } = setup(() => ({ items: reports(1), authors }))
    await screen.findByText('Report 1')

    await user.click(screen.getByRole('button', { name: 'Zawodnik - mecz' }))
    await waitFor(() => expect(lastRequest(requests).getAll('kinds')).toEqual(['PlayerMatch']))
    await user.click(screen.getByRole('button', { name: 'Drużyna - ogólny' }))
    await waitFor(() => expect(lastRequest(requests).getAll('kinds')).toEqual(['PlayerMatch', 'TeamGeneral']))
    await user.click(screen.getByRole('button', { name: 'Zawodnik - mecz' }))
    await waitFor(() => expect(lastRequest(requests).getAll('kinds')).toEqual(['TeamGeneral']))
  })

  it('filters by author, using the authors offered by the backend', async () => {
    const { requests, user } = setup(() => ({ items: reports(1), authors }))
    await screen.findByText('Report 1')

    await user.click(screen.getByRole('button', { name: 'Bartek Nowak' }))
    await user.click(screen.getByRole('button', { name: 'Anna Kowalska' }))

    await waitFor(() => expect(lastRequest(requests).getAll('authors')).toEqual(['a2', 'a1']))
  })

  it('filters by unread and by high priority', async () => {
    const { requests, user } = setup(() => ({ items: reports(1) }))
    await screen.findByText('Report 1')

    await user.click(screen.getByRole('button', { name: 'Nieprzeczytane' }))
    await waitFor(() => expect(lastRequest(requests).get('unreadOnly')).toBe('true'))
    await user.click(screen.getByRole('button', { name: 'Wysoki priorytet' }))
    await waitFor(() => expect(lastRequest(requests).get('highPriorityOnly')).toBe('true'))
    await user.click(screen.getByRole('button', { name: 'Nieprzeczytane' }))
    await waitFor(() => expect(lastRequest(requests).get('unreadOnly')).toBe('false'))
  })

  it('shows an empty message that mentions the filters', async () => {
    const { user } = setup((params) => (params.get('highPriorityOnly') === 'true' ? { items: [] } : { items: reports(1) }))
    await screen.findByText('Report 1')

    await user.click(screen.getByRole('button', { name: 'Wysoki priorytet' }))

    expect(await screen.findByText('Żaden raport nie pasuje do wybranych filtrów.')).toBeInTheDocument()
  })

  it('clears all the filters at once', async () => {
    const { requests, user } = setup(() => ({ items: reports(1), authors }))
    await screen.findByText('Report 1')
    expect(screen.queryByRole('button', { name: 'Wyczyść filtry' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Wysoki priorytet' }))
    await user.click(screen.getByRole('button', { name: 'Zawodnik - ogólny' }))
    await user.click(screen.getByRole('button', { name: 'Anna Kowalska' }))
    await user.type(screen.getByLabelText('Szukaj w tytule, treści, zawodniku lub rywalu'), 'abc')

    await user.click(await screen.findByRole('button', { name: 'Wyczyść filtry' }))

    await waitFor(() => {
      const params = lastRequest(requests)
      expect(params.get('highPriorityOnly')).toBe('false')
      expect(params.getAll('kinds')).toEqual([])
      expect(params.getAll('authors')).toEqual([])
      expect(params.has('search')).toBe(false)
    })
    expect(screen.getByLabelText('Szukaj w tytule, treści, zawodniku lub rywalu')).toHaveValue('')
    expect(screen.queryByRole('button', { name: 'Wyczyść filtry' })).not.toBeInTheDocument()
  })

  it('remembers the filters during the session', async () => {
    const { user } = setup(() => ({ items: reports(1), authors }))
    await screen.findByText('Report 1')

    await user.click(screen.getByRole('button', { name: 'Zawodnik - mecz' }))
    await user.click(screen.getByRole('button', { name: 'Anna Kowalska' }))
    await user.click(screen.getByRole('button', { name: 'Wysoki priorytet' }))

    expect(sessionStorage.getItem('reports.kinds')).toBe('["PlayerMatch"]')
    expect(sessionStorage.getItem('reports.authors')).toBe('["a1"]')
    expect(sessionStorage.getItem('reports.high')).toBe('true')
  })
})

describe('search', () => {
  const label = 'Szukaj w tytule, treści, zawodniku lub rywalu'

  it('waits for the user to stop typing before searching', async () => {
    const { requests, user } = setup(() => ({ items: reports(1) }))
    await screen.findByText('Report 1')
    const before = requests.length

    await user.type(screen.getByLabelText(label), 'ham')
    expect(requests.length).toBe(before)

    await waitFor(() => expect(requests.length).toBe(before + 1))
    expect(lastRequest(requests).get('search')).toBe('ham')
  })

  it('trims the search text', async () => {
    const { requests, user } = setup(() => ({ items: reports(1) }))
    await screen.findByText('Report 1')

    await user.type(screen.getByLabelText(label), '  hamstring  ')

    await waitFor(() => expect(lastRequest(requests).get('search')).toBe('hamstring'))
  })

  it('searches the whole history and says so', async () => {
    const { user } = setup((params) =>
      params.has('search') ? { items: reports(2), hasMore: false } : { items: reports(1), hasMore: true },
    )
    await screen.findByText('1 raport z ostatnich 30 dni')

    await user.type(screen.getByLabelText(label), 'x')

    expect(await screen.findByText('Znaleziono 2 raporty (cała historia)')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Załaduj starsze raporty' })).not.toBeInTheDocument()
  })

  it('does not search for blank text', async () => {
    const { requests, user } = setup(() => ({ items: reports(1) }))
    await screen.findByText('Report 1')

    await user.type(screen.getByLabelText(label), '   ')
    await new Promise((resolve) => setTimeout(resolve, 450))

    expect(requests.every((p) => !p.has('search'))).toBe(true)
    expect(screen.getByText('1 raport z ostatnich 30 dni')).toBeInTheDocument()
  })
})

describe('older reports', () => {
  it('loads 30 more days at a time and can collapse back', async () => {
    const { requests, user } = setup((params) => ({
      items: reports(Number(params.get('days')) / 30),
      hasMore: Number(params.get('days')) < 90,
    }))
    await screen.findByText('1 raport z ostatnich 30 dni')
    expect(screen.queryByRole('button', { name: 'Zwiń do ostatnich 30 dni' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Załaduj starsze raporty' }))
    expect(await screen.findByText('2 raporty z ostatnich 60 dni')).toBeInTheDocument()
    expect(lastRequest(requests).get('days')).toBe('60')
    expect(screen.getByRole('button', { name: 'Zwiń do ostatnich 30 dni' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Załaduj starsze raporty' }))
    expect(await screen.findByText('3 raporty z ostatnich 90 dni')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Załaduj starsze raporty' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Zwiń do ostatnich 30 dni' }))
    expect(await screen.findByText('1 raport z ostatnich 30 dni')).toBeInTheDocument()
  })

  it('offers no collapsing while searching', async () => {
    const { user } = setup((params) => ({ items: reports(1), hasMore: Number(params.get('days')) < 60 }))
    await screen.findByText('Report 1')
    await user.click(screen.getByRole('button', { name: 'Załaduj starsze raporty' }))
    await screen.findByRole('button', { name: 'Zwiń do ostatnich 30 dni' })

    await user.type(screen.getByLabelText('Szukaj w tytule, treści, zawodniku lub rywalu'), 'x')

    await waitFor(() => expect(screen.queryByRole('button', { name: 'Zwiń do ostatnich 30 dni' })).not.toBeInTheDocument())
  })
})

describe('creating a report', () => {
  it('opens the form from the button and reloads the list after saving', async () => {
    let loads = 0
    mockApi('get', '/players', [makePlayer({ id: 1 })])
    mockApi('get', '/matches', [makeMatch({ id: 1 })])
    const created = mockApi('post', '/reports', makeReport({ id: 50 }))
    server.use(
      http.get(`${API}/reports`, () => {
        loads += 1
        return HttpResponse.json({ items: loads > 1 ? reports(2) : reports(1), hasMore: false, unreadCount: 0, authors: [] })
      }),
    )
    renderApp('/reports', COACH)
    const user = userEvent.setup({ delay: null })
    await screen.findByText('Report 1')

    await user.click(screen.getByRole('button', { name: 'Dodaj raport' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Nowy raport')).toBeInTheDocument()
    await user.type(within(dialog).getByLabelText(/Tytuł/), 'New report')
    await user.type(within(dialog).getByLabelText(/Treść/), 'Some content')
    await user.click(within(dialog).getByRole('button', { name: 'Dodaj' }))

    expect(await screen.findByText('Report 2')).toBeInTheDocument()
    expect(created.body).toMatchObject({ title: 'New report', content: 'Some content', teamId: 1 })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('is available to every role that can see the reports', async () => {
    setup(() => ({ items: reports(1) }), ANALYST)

    expect(await screen.findByRole('button', { name: 'Dodaj raport' })).toBeInTheDocument()
  })
})
