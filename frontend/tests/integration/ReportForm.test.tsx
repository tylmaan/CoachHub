import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { AuthProvider } from '@/context/AuthContext'
import { ReportFormDialog } from '@/components/reports/ReportFormDialog'
import type { Report } from '@/types/report'
import { API, server } from '../mocks/server'
import { makeMatch, makePlayer, makeReport } from '../utils/factories'
import { seedAuth } from '../utils/render'

const players = [
  makePlayer({ id: 3, firstName: 'Piotr', lastName: 'Zieliński' }),
  makePlayer({ id: 1, firstName: 'Jan', lastName: 'Kowalski' }),
  makePlayer({ id: 2, firstName: 'Old', lastName: 'Timer', archivedAt: '2025-01-01' }),
]

const matches = [
  makeMatch({ id: 10, opponent: 'Alpha', date: '2025-08-01' }),
  makeMatch({ id: 11, opponent: 'Beta', date: '2025-09-15' }),
]

function setup(report: Report | null = null, failSave?: Response) {
  seedAuth({ roles: ['Coach'], teamId: 4 })
  const saved = { created: [] as unknown[], updated: [] as Array<{ id: string; body: unknown }> }
  server.use(
    http.get(`${API}/players`, () => HttpResponse.json(players)),
    http.get(`${API}/matches`, () => HttpResponse.json(matches)),
    http.post(`${API}/reports`, async ({ request }) => {
      if (failSave) return failSave.clone()
      saved.created.push(await request.json())
      return HttpResponse.json(makeReport({ id: 99 }), { status: 201 })
    }),
    http.put(`${API}/reports/:id`, async ({ request, params }) => {
      if (failSave) return failSave.clone()
      saved.updated.push({ id: params.id as string, body: await request.json() })
      return new HttpResponse(null, { status: 204 })
    }),
  )
  const onClose = vi.fn()
  const onSaved = vi.fn()
  render(
    <AuthProvider>
      <ReportFormDialog report={report} onClose={onClose} onSaved={onSaved} />
    </AuthProvider>,
  )
  return { saved, onClose, onSaved, user: userEvent.setup({ delay: null }) }
}

const dialog = () => screen.getByRole('dialog')

describe('new report', () => {
  it('starts empty, for the whole team, with normal priority', () => {
    setup()

    expect(within(dialog()).getByText('Nowy raport')).toBeInTheDocument()
    expect(within(dialog()).getByLabelText(/Tytuł/)).toHaveValue('')
    expect(within(dialog()).getByLabelText(/Treść/)).toHaveValue('')
    expect(within(dialog()).getByRole('button', { name: 'Normalny' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(dialog()).getByRole('button', { name: 'Cała drużyna' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(dialog()).queryByRole('combobox', { name: /Zawodnik/ })).not.toBeInTheDocument()
  })

  it('limits the title to 200 characters', () => {
    setup()

    expect(within(dialog()).getByLabelText(/Tytuł/)).toHaveAttribute('maxlength', '200')
  })

  it('saves a report about the whole team of the logged-in user', async () => {
    const { saved, onSaved, user } = setup()

    await user.type(within(dialog()).getByLabelText(/Tytuł/), 'Team review')
    await user.type(within(dialog()).getByLabelText(/Treść/), 'Good week')
    await user.click(within(dialog()).getByRole('button', { name: 'Dodaj' }))

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1))
    expect(saved.created).toEqual([
      { title: 'Team review', content: 'Good week', priority: 'Normal', playerId: null, teamId: 4, matchId: null },
    ])
  })

  it('saves the chosen priority', async () => {
    const { saved, onSaved, user } = setup()
    await user.type(within(dialog()).getByLabelText(/Tytuł/), 'Urgent')
    await user.type(within(dialog()).getByLabelText(/Treść/), 'Injury')

    await user.click(within(dialog()).getByRole('button', { name: 'Wysoki' }))
    await user.click(within(dialog()).getByRole('button', { name: 'Dodaj' }))

    await waitFor(() => expect(onSaved).toHaveBeenCalled())
    expect(saved.created[0]).toMatchObject({ priority: 'High' })
  })

  it('saves a report about a player instead of the team', async () => {
    const { saved, onSaved, user } = setup()
    await user.type(within(dialog()).getByLabelText(/Tytuł/), 'Player review')
    await user.type(within(dialog()).getByLabelText(/Treść/), 'Sharp')

    await user.click(within(dialog()).getByRole('button', { name: 'Zawodnik' }))
    await user.click(within(dialog()).getByRole('combobox', { name: /Zawodnik/ }))
    await user.click(screen.getByRole('option', { name: 'Jan Kowalski' }))
    await user.click(within(dialog()).getByRole('button', { name: 'Dodaj' }))

    await waitFor(() => expect(onSaved).toHaveBeenCalled())
    expect(saved.created[0]).toMatchObject({ playerId: 1, teamId: null })
  })

  it('lists the active players ordered by last name', async () => {
    const { user } = setup()

    await user.click(within(dialog()).getByRole('button', { name: 'Zawodnik' }))
    await user.click(within(dialog()).getByRole('combobox', { name: /Zawodnik/ }))

    await waitFor(() => expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Jan Kowalski', 'Piotr Zieliński']))
  })

  it('does not submit a player report without a player', async () => {
    const { saved, user } = setup()
    await user.type(within(dialog()).getByLabelText(/Tytuł/), 'Player review')
    await user.type(within(dialog()).getByLabelText(/Treść/), 'Sharp')
    await user.click(within(dialog()).getByRole('button', { name: 'Zawodnik' }))

    await user.click(within(dialog()).getByRole('button', { name: 'Dodaj' }))

    expect(saved.created).toEqual([])
  })

  it('ties the report to a match, newest matches first', async () => {
    const { saved, onSaved, user } = setup()
    await user.type(within(dialog()).getByLabelText(/Tytuł/), 'Match review')
    await user.type(within(dialog()).getByLabelText(/Treść/), 'Tough')

    await user.click(within(dialog()).getByRole('combobox', { name: /Dotyczy meczu/ }))
    await waitFor(() => expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Bez meczu', '2025-09-15 · Beta', '2025-08-01 · Alpha']))
    await user.click(screen.getByRole('option', { name: '2025-09-15 · Beta' }))
    await user.click(within(dialog()).getByRole('button', { name: 'Dodaj' }))

    await waitFor(() => expect(onSaved).toHaveBeenCalled())
    expect(saved.created[0]).toMatchObject({ matchId: 11 })
  })

  it('can clear the match again', async () => {
    const { saved, onSaved, user } = setup()
    await user.type(within(dialog()).getByLabelText(/Tytuł/), 'R')
    await user.type(within(dialog()).getByLabelText(/Treść/), 'C')
    await user.click(within(dialog()).getByRole('combobox', { name: /Dotyczy meczu/ }))
    await user.click(await screen.findByRole('option', { name: '2025-09-15 · Beta' }))
    await user.click(within(dialog()).getByRole('combobox', { name: /Dotyczy meczu/ }))
    await user.click(screen.getByRole('option', { name: 'Bez meczu' }))

    await user.click(within(dialog()).getByRole('button', { name: 'Dodaj' }))

    await waitFor(() => expect(onSaved).toHaveBeenCalled())
    expect(saved.created[0]).toMatchObject({ matchId: null })
  })

  it('does not submit without a title or without content', async () => {
    const { saved, user } = setup()

    await user.click(within(dialog()).getByRole('button', { name: 'Dodaj' }))
    await user.type(within(dialog()).getByLabelText(/Tytuł/), 'Only a title')
    await user.click(within(dialog()).getByRole('button', { name: 'Dodaj' }))

    expect(saved.created).toEqual([])
  })

  it('shows the validation messages of the backend and keeps the form', async () => {
    const { onSaved, user } = setup(null, Response.json(['Tytuł jest wymagany (max 200 znaków).', 'Nieprawidłowy mecz.'], { status: 400 }))
    await user.type(within(dialog()).getByLabelText(/Tytuł/), 'X')
    await user.type(within(dialog()).getByLabelText(/Treść/), 'Y')

    await user.click(within(dialog()).getByRole('button', { name: 'Dodaj' }))

    expect(await within(dialog()).findByText('Tytuł jest wymagany (max 200 znaków). Nieprawidłowy mecz.')).toBeInTheDocument()
    expect(onSaved).not.toHaveBeenCalled()
    expect(within(dialog()).getByLabelText(/Tytuł/)).toHaveValue('X')
  })

  it('shows a generic message for other failures', async () => {
    const { user } = setup(null, new Response(null, { status: 500 }))
    await user.type(within(dialog()).getByLabelText(/Tytuł/), 'X')
    await user.type(within(dialog()).getByLabelText(/Treść/), 'Y')

    await user.click(within(dialog()).getByRole('button', { name: 'Dodaj' }))

    expect(await within(dialog()).findByText('Nie udało się zapisać raportu.')).toBeInTheDocument()
  })

  it('closes without saving when cancelled', async () => {
    const { saved, onClose, user } = setup()

    await user.click(within(dialog()).getByRole('button', { name: 'Anuluj' }))

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(saved.created).toEqual([])
  })
})

describe('existing report', () => {
  const existing = makeReport({
    id: 8,
    title: 'Old title',
    content: 'Old content',
    priority: 'High',
    playerId: 1,
    playerName: 'Jan Kowalski',
    teamId: null,
    matchId: 10,
  })

  it('is prefilled with the report', async () => {
    setup(existing)

    expect(within(dialog()).getByText('Edytuj raport')).toBeInTheDocument()
    expect(within(dialog()).getByLabelText(/Tytuł/)).toHaveValue('Old title')
    expect(within(dialog()).getByLabelText(/Treść/)).toHaveValue('Old content')
    expect(within(dialog()).getByRole('button', { name: 'Wysoki' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(dialog()).getByRole('button', { name: 'Zawodnik' })).toHaveAttribute('aria-pressed', 'true')
    await waitFor(() => expect(within(dialog()).getByRole('combobox', { name: /Zawodnik/ })).toHaveTextContent('Jan Kowalski'))
    expect(within(dialog()).getByRole('combobox', { name: /Dotyczy meczu/ })).toHaveTextContent('2025-08-01 · Alpha')
  })

  it('saves the changes to the existing report', async () => {
    const { saved, onSaved, user } = setup(existing)
    await user.clear(within(dialog()).getByLabelText(/Tytuł/))
    await user.type(within(dialog()).getByLabelText(/Tytuł/), 'New title')

    await user.click(within(dialog()).getByRole('button', { name: 'Zapisz' }))

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1))
    expect(saved.updated).toEqual([
      { id: '8', body: { title: 'New title', content: 'Old content', priority: 'High', playerId: 1, teamId: null, matchId: 10 } },
    ])
    expect(saved.created).toEqual([])
  })

  it('keeps an archived player in the list when the report is about them', async () => {
    const { user } = setup(makeReport({ id: 8, playerId: 2, playerName: 'Old Timer', teamId: null }))

    await waitFor(() => expect(within(dialog()).getByRole('combobox', { name: /Zawodnik/ })).toHaveTextContent('Old Timer'))
    await user.click(within(dialog()).getByRole('combobox', { name: /Zawodnik/ }))

    expect(screen.getAllByRole('option').map((o) => o.textContent)).toContain('Old Timer')
  })

  it('switches a player report to a team report', async () => {
    const { saved, onSaved, user } = setup(existing)

    await user.click(within(dialog()).getByRole('button', { name: 'Cała drużyna' }))
    await user.click(within(dialog()).getByRole('button', { name: 'Zapisz' }))

    await waitFor(() => expect(onSaved).toHaveBeenCalled())
    expect(saved.updated[0].body).toMatchObject({ playerId: null, teamId: 4 })
  })
})
