import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormStrip } from '@/components/stats/FormStrip'
import { MatchNoteField } from '@/components/matches/MatchNoteField'
import { MatchNotesSection } from '@/components/matches/MatchNotesSection'
import { MatchRowAction } from '@/components/matches/MatchRowAction'
import { makeMatch, makeResult } from '../../utils/factories'
import { mockApi } from '../../utils/mockApi'
import { renderWithProviders } from '../../utils/render'

describe('FormStrip', () => {
  it('shows a win, a loss and a draw as W, P and R', () => {
    renderWithProviders(
      <FormStrip
        results={[
          makeResult({ matchId: 1, scoreFor: 2, scoreAgainst: 1 }),
          makeResult({ matchId: 2, scoreFor: 0, scoreAgainst: 3 }),
          makeResult({ matchId: 3, scoreFor: 1, scoreAgainst: 1 }),
        ]}
      />,
    )

    expect(screen.getAllByRole('link').map((l) => l.textContent)).toEqual(['W', 'P', 'R'])
  })

  it('links every result to its match, keeping the given order', () => {
    renderWithProviders(<FormStrip results={[makeResult({ matchId: 7 }), makeResult({ matchId: 3 })]} />)

    expect(screen.getAllByRole('link').map((l) => l.getAttribute('href'))).toEqual(['/matches/7', '/matches/3'])
  })

  it('describes each result with opponent, score and venue', () => {
    renderWithProviders(
      <FormStrip
        results={[
          makeResult({ matchId: 1, opponent: 'Alpha', scoreFor: 2, scoreAgainst: 1, isHome: true }),
          makeResult({ matchId: 2, opponent: 'Beta', scoreFor: 0, scoreAgainst: 0, isHome: false }),
          makeResult({ matchId: 3, opponent: 'Gamma', scoreFor: 1, scoreAgainst: 1, isHome: null }),
        ]}
      />,
    )

    expect(screen.getByLabelText('Alpha (2:1 (dom))')).toBeInTheDocument()
    expect(screen.getByLabelText('Beta (0:0 (wyjazd))')).toBeInTheDocument()
    expect(screen.getByLabelText('Gamma (1:1)')).toBeInTheDocument()
  })

  it('explains how to read the strip', () => {
    renderWithProviders(<FormStrip results={[]} />)

    expect(screen.getByText('Forma: ostatnie mecze')).toBeInTheDocument()
    expect(screen.getByText(/Najnowszy po prawej/)).toBeInTheDocument()
  })
})

describe('MatchRowAction', () => {
  function setup(props: Partial<Parameters<typeof MatchRowAction>[0]> = {}) {
    const handlers = { onFinish: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn() }
    const match = props.match ?? makeMatch({ id: 5, status: 'Planned' })
    renderWithProviders(<MatchRowAction match={match} canEdit canDelete {...handlers} {...props} />)
    return { ...handlers, match, user: userEvent.setup() }
  }

  it('always offers the details link', () => {
    setup({ canEdit: false, canDelete: false })

    expect(screen.getByText('Szczegóły').closest('a')).toHaveAttribute('href', '/matches/5')
  })

  it('offers finish, edit and delete to users who may do so', () => {
    setup()

    expect(screen.getByText('Zakończ mecz')).toBeInTheDocument()
    expect(screen.getByText('Edytuj')).toBeInTheDocument()
    expect(screen.getByText('Usuń')).toBeInTheDocument()
  })

  it('does not offer finishing a match that was already played', () => {
    setup({ match: makeMatch({ id: 5, status: 'Played', scoreFor: 1, scoreAgainst: 0 }) })

    expect(screen.queryByText('Zakończ mecz')).not.toBeInTheDocument()
    expect(screen.getByText('Edytuj')).toBeInTheDocument()
  })

  it('hides finish and edit from users who cannot edit', () => {
    setup({ canEdit: false })

    expect(screen.queryByText('Zakończ mecz')).not.toBeInTheDocument()
    expect(screen.queryByText('Edytuj')).not.toBeInTheDocument()
    expect(screen.getByText('Usuń')).toBeInTheDocument()
  })

  it('hides delete from users who cannot delete', () => {
    setup({ canDelete: false })

    expect(screen.queryByText('Usuń')).not.toBeInTheDocument()
    expect(screen.getByText('Edytuj')).toBeInTheDocument()
  })

  it('calls the handlers with the match', async () => {
    const { user, onFinish, onEdit, onDelete, match } = setup()

    await user.click(screen.getByText('Zakończ mecz'))
    await user.click(screen.getByText('Edytuj'))
    await user.click(screen.getByText('Usuń'))

    expect(onFinish).toHaveBeenCalledWith(5)
    expect(onEdit).toHaveBeenCalledWith(match)
    expect(onDelete).toHaveBeenCalledWith(5)
  })

  describe('compact menu', () => {
    it('lists the same actions and runs the chosen one', async () => {
      const { user, onEdit, match } = setup()

      await user.click(screen.getByLabelText('Akcje meczu'))
      const menu = screen.getByRole('menu')
      expect(within(menu).getAllByRole('menuitem').map((i) => i.textContent)).toEqual([
        'Szczegóły',
        'Zakończ mecz',
        'Edytuj',
        'Usuń',
      ])

      await user.click(within(menu).getByText('Edytuj'))

      expect(onEdit).toHaveBeenCalledWith(match)
      await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
    })

    it('omits actions the user cannot perform', async () => {
      const { user } = setup({ canEdit: false, canDelete: false })

      await user.click(screen.getByLabelText('Akcje meczu'))

      expect(within(screen.getByRole('menu')).getAllByRole('menuitem').map((i) => i.textContent)).toEqual(['Szczegóły'])
    })
  })
})

describe('MatchNoteField', () => {
  function setup(props: Partial<Parameters<typeof MatchNoteField>[0]> = {}) {
    const save = vi.fn().mockResolvedValue(undefined)
    renderWithProviders(<MatchNoteField title="Plan na mecz" initialText="Press high" canEdit save={save} {...props} />)
    const user = userEvent.setup({ delay: null })
    return { save, user }
  }

  async function wait(ms: number) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ms)
    })
  }

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('read-only', () => {
    it('shows the note as plain text', () => {
      setup({ canEdit: false })

      expect(screen.getByText('Plan na mecz')).toBeInTheDocument()
      expect(screen.getByText('Press high')).toBeInTheDocument()
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    })

    it('says there are no notes when the note is empty', () => {
      setup({ canEdit: false, initialText: null })

      expect(screen.getByText('Brak notatek')).toBeInTheDocument()
    })
  })

  describe('editable', () => {
    it('shows the note in a text box limited to 4000 characters', () => {
      setup()

      const box = screen.getByRole('textbox')
      expect(box).toHaveValue('Press high')
      expect(box).toHaveAttribute('maxlength', '4000')
    })

    it('starts with an empty box when there is no note yet', () => {
      setup({ initialText: null })

      expect(screen.getByRole('textbox')).toHaveValue('')
    })

    it('reports that everything is saved at the start', () => {
      setup()

      expect(screen.getByText('Zapisano automatycznie')).toBeInTheDocument()
    })

    it('saves the text a moment after typing stops', async () => {
      const { user, save } = setup({ initialText: 'Plan' })

      await user.type(screen.getByRole('textbox'), ' B')
      expect(screen.getByText('Zapisywanie...')).toBeInTheDocument()
      expect(save).not.toHaveBeenCalled()

      await wait(800)

      expect(save).toHaveBeenCalledTimes(1)
      expect(save).toHaveBeenCalledWith('Plan B')
      expect(screen.getByText('Zapisano automatycznie')).toBeInTheDocument()
    })

    it('saves a cleared note as an empty text', async () => {
      const { user, save } = setup({ initialText: 'Plan' })

      await user.clear(screen.getByRole('textbox'))
      await wait(800)

      expect(save).toHaveBeenCalledWith('')
    })

    it('reports a failed save and retries on request', async () => {
      const save = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined)
      const { user } = setup({ initialText: 'Plan', save })

      await user.type(screen.getByRole('textbox'), '!')
      await wait(800)
      expect(screen.getByText('Nie udało się zapisać zmian')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Ponów' }))

      expect(await screen.findByText('Zapisano automatycznie')).toBeInTheDocument()
      expect(save).toHaveBeenCalledTimes(2)
      expect(screen.queryByRole('button', { name: 'Ponów' })).not.toBeInTheDocument()
    })
  })
})

describe('MatchNotesSection', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('shows both notes of the match', () => {
    renderWithProviders(
      <MatchNotesSection
        match={makeMatch({ gamePlan: 'Press high', opponentNotes: 'Slow defenders' })}
        canEditGamePlan={false}
        canEditOpponentNotes={false}
      />,
    )

    expect(screen.getByText('Notatki do meczu')).toBeInTheDocument()
    expect(screen.getByText('Plan na mecz')).toBeInTheDocument()
    expect(screen.getByText('Press high')).toBeInTheDocument()
    expect(screen.getByText('O przeciwniku')).toBeInTheDocument()
    expect(screen.getByText('Slow defenders')).toBeInTheDocument()
  })

  it('makes only the permitted notes editable', () => {
    renderWithProviders(
      <MatchNotesSection match={makeMatch()} canEditGamePlan={false} canEditOpponentNotes />,
    )

    expect(screen.getAllByRole('textbox')).toHaveLength(1)
  })

  it('saves the game plan to the game plan endpoint', async () => {
    const captured = mockApi('put', '/matches/5/game-plan')
    renderWithProviders(
      <MatchNotesSection match={makeMatch({ id: 5, gamePlan: null })} canEditGamePlan canEditOpponentNotes={false} />,
    )

    await userEvent.setup().type(screen.getByRole('textbox'), 'Counter attack')

    await waitFor(() => expect(captured.calls).toBe(1), { timeout: 3000 })
    expect(captured.body).toEqual({ text: 'Counter attack' })
  })

  it('saves the opponent notes to the opponent notes endpoint', async () => {
    const captured = mockApi('put', '/matches/5/opponent-notes')
    renderWithProviders(
      <MatchNotesSection match={makeMatch({ id: 5 })} canEditGamePlan={false} canEditOpponentNotes />,
    )

    await userEvent.setup().type(screen.getByRole('textbox'), 'Weak on the left')

    await waitFor(() => expect(captured.calls).toBe(1), { timeout: 3000 })
    expect(captured.body).toEqual({ text: 'Weak on the left' })
  })
})
