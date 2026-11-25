import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import type { Report } from '@/types/report'
import { API, server } from '../mocks/server'
import { makeMatch, makePlayer, makeReport } from '../utils/factories'
import { ANALYST, ASSISTANT, COACH, renderApp } from '../utils/renderApp'

interface Options {
  report?: Report
  failDelete?: boolean
  failLoad?: boolean
  schemes?: unknown[]
}

function setup({ report = makeReport({ id: 7, canEdit: true }), failDelete, failLoad, schemes = [] }: Options = {}, auth = COACH) {
  let current = report
  const state = { gets: 0, read: 0, updated: [] as unknown[], deleted: 0 }

  server.use(
    http.get(`${API}/reports/:id`, () => {
      state.gets += 1
      return failLoad ? new HttpResponse(null, { status: 500 }) : HttpResponse.json(current)
    }),
    http.post(`${API}/reports/:id/read`, () => {
      state.read += 1
      return new HttpResponse(null, { status: 204 })
    }),
    http.put(`${API}/reports/:id`, async ({ request }) => {
      const body = (await request.json()) as Partial<Report>
      state.updated.push(body)
      current = { ...current, ...body } as Report
      return new HttpResponse(null, { status: 204 })
    }),
    http.delete(`${API}/reports/:id`, () => {
      state.deleted += 1
      return failDelete ? new HttpResponse(null, { status: 500 }) : new HttpResponse(null, { status: 204 })
    }),
    http.get(`${API}/tacticalschemes/report/:id`, () => HttpResponse.json(schemes)),
    http.get(`${API}/players`, () => HttpResponse.json([makePlayer({ id: 1, firstName: 'Jan', lastName: 'Kowalski' })])),
    http.get(`${API}/matches`, () => HttpResponse.json([makeMatch({ id: 5, opponent: 'Rival FC', date: '2025-09-10' })])),
    http.get(`${API}/reports`, () => HttpResponse.json({ items: [], hasMore: false, unreadCount: 0, authors: [] })),
  )

  renderApp('/reports/7', auth)
  return { state, user: userEvent.setup({ delay: null }) }
}

describe('report page', () => {
  it('shows the subject, the title, the kind, the priority, the author and the content', async () => {
    setup({
      report: makeReport({
        id: 7,
        playerId: 3,
        playerName: 'Jan Kowalski',
        matchId: 5,
        matchOpponent: 'Rival FC',
        matchDate: '2025-09-10',
        title: 'Strong first half',
        content: 'He pressed well.\nAnd tracked back.',
        priority: 'High',
        authorName: 'Anna Kowalska',
        createdAt: '2025-10-05T12:00:00Z',
      }),
    })

    expect(await screen.findByRole('heading', { name: 'Jan Kowalski vs Rival FC' })).toBeInTheDocument()
    expect(screen.getByText('Strong first half')).toBeInTheDocument()
    expect(screen.getByText('Zawodnik - mecz')).toBeInTheDocument()
    expect(screen.getByText('Priorytet: wysoki')).toBeInTheDocument()
    expect(screen.getByText(/Anna Kowalska · /)).toBeInTheDocument()
    expect(screen.getByText(/He pressed well\.\s+And tracked back\./)).toBeInTheDocument()
  })

  it('links to the match the report is about', async () => {
    setup({ report: makeReport({ id: 7, matchId: 5, matchOpponent: 'Rival FC', matchDate: '2025-09-10' }) })

    const chip = await screen.findByText('Mecz z Rival FC · 2025-09-10')

    expect(chip.closest('a')).toHaveAttribute('href', '/matches/5')
  })

  it('shows no match link for a report that is not about a match', async () => {
    setup({ report: makeReport({ id: 7, matchId: null }) })
    await screen.findByText('Strong first half'.replace('Strong first half', 'Weekly review'))

    expect(screen.queryByText(/^Mecz z /)).not.toBeInTheDocument()
  })

  it('labels the kind and priority of a general team report', async () => {
    setup({ report: makeReport({ id: 7, priority: 'Low', teamName: 'Cracovia' }) })

    expect(await screen.findByText('Drużyna - ogólny')).toBeInTheDocument()
    expect(screen.getByText('Priorytet: niski')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Cracovia - raport' })).toBeInTheDocument()
  })

  it('links back to the reports list', async () => {
    setup()
    await screen.findByText('Weekly review')

    expect(screen.getByLabelText('Wróć')).toHaveAttribute('href', '/reports')
  })

  it('shows an error when the report cannot be loaded', async () => {
    setup({ failLoad: true })

    expect(await screen.findByText('Nie udało się pobrać raportu.')).toBeInTheDocument()
  })
})

describe('marking as read', () => {
  it('marks an unread report as read', async () => {
    const { state } = setup({ report: makeReport({ id: 7, isRead: false }) })
    await screen.findByText('Weekly review')

    await waitFor(() => expect(state.read).toBe(1))
  })

  it('does not mark a report that is already read', async () => {
    const { state } = setup({ report: makeReport({ id: 7, isRead: true }) })
    await screen.findByText('Weekly review')

    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(state.read).toBe(0)
  })

  it('still shows the report when marking it as read fails', async () => {
    server.use(http.post(`${API}/reports/:id/read`, () => new HttpResponse(null, { status: 500 })))
    setup({ report: makeReport({ id: 7, isRead: false }) })

    expect(await screen.findByText('Weekly review')).toBeInTheDocument()
  })
})

describe('permissions', () => {
  it('shows edit and delete to a coach who can edit the report', async () => {
    setup({ report: makeReport({ id: 7, canEdit: true }) }, COACH)

    expect(await screen.findByRole('button', { name: 'Edytuj' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Usuń' })).toBeInTheDocument()
  })

  it('shows only edit to the author who is not a coach', async () => {
    setup({ report: makeReport({ id: 7, canEdit: true }) }, ASSISTANT)

    expect(await screen.findByRole('button', { name: 'Edytuj' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Usuń' })).not.toBeInTheDocument()
  })

  it('shows no actions to someone who cannot edit and is not a coach', async () => {
    setup({ report: makeReport({ id: 7, canEdit: false }) }, ANALYST)
    await screen.findByText('Weekly review')

    expect(screen.queryByRole('button', { name: 'Edytuj' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Usuń' })).not.toBeInTheDocument()
  })

  it('shows only delete to a coach who cannot edit the report', async () => {
    setup({ report: makeReport({ id: 7, canEdit: false }) }, COACH)

    expect(await screen.findByRole('button', { name: 'Usuń' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edytuj' })).not.toBeInTheDocument()
  })
})

describe('tactical boards of the report', () => {
  it('lists the boards and lets editors add one', async () => {
    setup({ report: makeReport({ id: 7, canEdit: true }), schemes: [{ id: 1, name: 'Scouting board', data: '{"version":1,"objects":[]}', matchId: null, reportId: 7, createdAt: '2025-10-01T10:00:00Z', updatedAt: '2025-10-02T10:00:00Z' }] })

    expect(await screen.findByText('Tablice taktyczne')).toBeInTheDocument()
    expect(await screen.findByText('Scouting board')).toBeInTheDocument()
    expect(screen.getByText('Nowa tablica')).toBeInTheDocument()
  })

  it('shows read-only users the boards without adding or deleting', async () => {
    setup({ report: makeReport({ id: 7, canEdit: false }) }, ANALYST)

    expect(await screen.findByText('Brak tablic taktycznych.')).toBeInTheDocument()
    expect(screen.queryByText('Nowa tablica')).not.toBeInTheDocument()
  })
})

describe('editing the report', () => {
  it('opens the form with the report and saves the changes', async () => {
    const { state, user } = setup({ report: makeReport({ id: 7, canEdit: true, title: 'Old title', content: 'Old content', priority: 'Normal', teamName: 'Cracovia' }) })
    await screen.findByText('Old title')

    await user.click(screen.getByRole('button', { name: 'Edytuj' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Edytuj raport')).toBeInTheDocument()
    expect(within(dialog).getByLabelText(/Tytuł/)).toHaveValue('Old title')
    await user.clear(within(dialog).getByLabelText(/Tytuł/))
    await user.type(within(dialog).getByLabelText(/Tytuł/), 'New title')
    await user.click(within(dialog).getByRole('button', { name: 'Wysoki' }))
    await user.click(within(dialog).getByRole('button', { name: 'Zapisz' }))

    expect(await screen.findByText('New title')).toBeInTheDocument()
    expect(state.updated).toEqual([
      { title: 'New title', content: 'Old content', priority: 'High', playerId: null, teamId: 1, matchId: null },
    ])
    expect(screen.getByText('Priorytet: wysoki')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})

describe('deleting the report', () => {
  it('asks for confirmation, deletes the report and returns to the list', async () => {
    const { state, user } = setup()
    await screen.findByText('Weekly review')

    await user.click(screen.getByRole('button', { name: 'Usuń' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Usunąć raport?')).toBeInTheDocument()
    expect(within(dialog).getByText('Raport zostanie trwale usunięty. Tej operacji nie można cofnąć.')).toBeInTheDocument()
    expect(state.deleted).toBe(0)
    await user.click(within(dialog).getByRole('button', { name: 'Usuń' }))

    expect(await screen.findByText('Raporty', { selector: 'h4' })).toBeInTheDocument()
    expect(state.deleted).toBe(1)
  })

  it('does not delete when cancelled', async () => {
    const { state, user } = setup()
    await screen.findByText('Weekly review')
    await user.click(screen.getByRole('button', { name: 'Usuń' }))

    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Anuluj' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(state.deleted).toBe(0)
    expect(screen.getByText('Weekly review')).toBeInTheDocument()
  })

  it('shows an error and closes the confirmation when deleting fails', async () => {
    const { user } = setup({ failDelete: true })
    await screen.findByText('Weekly review')
    await user.click(screen.getByRole('button', { name: 'Usuń' }))

    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Usuń' }))

    expect(await screen.findByText('Nie udało się usunąć raportu.')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByText('Weekly review')).toBeInTheDocument()
  })
})

