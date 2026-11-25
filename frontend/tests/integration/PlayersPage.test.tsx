import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { makePlayer } from '../utils/factories'
import { fakePlayers } from '../utils/fakePlayers'
import { ANALYST, ASSISTANT, COACH, renderApp } from '../utils/renderApp'

const roster = () => [
  makePlayer({ id: 1, firstName: 'Jan', lastName: 'Kowalski', position: 'CM', jerseyNumber: 8, dateOfBirth: '2000-01-10', heightCm: 180, preferredFoot: 'Right', nationality: 'pl' }),
  makePlayer({ id: 2, firstName: 'Adam', lastName: 'Nowak', position: 'GK', jerseyNumber: 1, dateOfBirth: '1995-05-20', heightCm: 190, preferredFoot: 'Left', nationality: 'de' }),
  makePlayer({ id: 3, firstName: 'Piotr', lastName: 'Zieliński', position: 'ST', jerseyNumber: null, dateOfBirth: '2003-03-03', heightCm: null, preferredFoot: null, nationality: null }),
  makePlayer({ id: 4, firstName: 'Old', lastName: 'Timer', position: 'CB', archivedAt: '2025-01-01' }),
]

const lastNames = () =>
  screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[2]?.textContent)

const rowOf = (lastName: string) => screen.getByText(lastName).closest('tr') as HTMLElement

function setup(options?: Parameters<typeof fakePlayers>[1], auth = COACH, initial = roster()) {
  const backend = fakePlayers(initial, options)
  renderApp('/players', auth)
  return { backend, user: userEvent.setup({ delay: null }) }
}

describe('players list', () => {
  it('shows the active players with their details and the tab counts', async () => {
    setup()

    expect(await screen.findByText('Kowalski')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Aktywni (3)' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Archiwum (1)' })).toBeInTheDocument()
    expect(screen.queryByText('Timer')).not.toBeInTheDocument()

    const row = within(rowOf('Kowalski'))
    expect(row.getByText('Jan')).toBeInTheDocument()
    expect(row.getByText('Polska')).toBeInTheDocument()
    expect(row.getByText('Środkowy pomocnik')).toBeInTheDocument()
    expect(row.getByText('180')).toBeInTheDocument()
    expect(row.getByText('8')).toBeInTheDocument()
  })

  it('shows dashes for unknown values', async () => {
    setup()
    await screen.findByText('Zieliński')

    const cells = within(rowOf('Zieliński')).getAllByRole('cell').map((c) => c.textContent)
    expect(cells.filter((c) => c === '-')).toHaveLength(3)
  })

  it('shows the date of birth with the current age', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2025, 5, 15))
    setup()

    expect(await screen.findByText('2000-01-10 (25)')).toBeInTheDocument()
    expect(screen.getByText('1995-05-20 (30)')).toBeInTheDocument()
    expect(screen.getByText('2003-03-03 (22)')).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('counts a birthday that has not happened yet this year', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2025, 0, 5))
    setup()

    expect(await screen.findByText('2000-01-10 (24)')).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('shows an error when the players cannot be loaded', async () => {
    setup({ failOn: { list: new Response(null, { status: 500 }) } })

    expect(await screen.findByText('Nie udało się pobrać zawodników.')).toBeInTheDocument()
  })

  it('says so when there are no players', async () => {
    setup(undefined, COACH, [])

    expect(await screen.findByText('Brak zawodników spełniających kryteria.')).toBeInTheDocument()
  })

  describe('search', () => {
    it('filters by first and last name', async () => {
      const { user } = setup()
      await screen.findByText('Kowalski')

      await user.type(screen.getByPlaceholderText('Szukaj zawodnika...'), 'adam')
      expect(lastNames()).toEqual(['Nowak'])

      await user.clear(screen.getByPlaceholderText('Szukaj zawodnika...'))
      await user.type(screen.getByPlaceholderText('Szukaj zawodnika...'), 'kowal')
      expect(lastNames()).toEqual(['Kowalski'])
    })

    it('ignores Polish diacritics', async () => {
      const { user } = setup()
      await screen.findByText('Kowalski')

      await user.type(screen.getByPlaceholderText('Szukaj zawodnika...'), 'zielinski')

      expect(lastNames()).toEqual(['Zieliński'])
    })

    it('shows the empty message when nothing matches', async () => {
      const { user } = setup()
      await screen.findByText('Kowalski')

      await user.type(screen.getByPlaceholderText('Szukaj zawodnika...'), 'xyz')

      expect(screen.getByText('Brak zawodników spełniających kryteria.')).toBeInTheDocument()
    })

    it('is remembered while the user stays in the session', async () => {
      const { user } = setup()
      await screen.findByText('Kowalski')
      await user.type(screen.getByPlaceholderText('Szukaj zawodnika...'), 'nowak')

      expect(sessionStorage.getItem('players.search')).toBe('"nowak"')
    })

    // normalize() strips combining marks, but "ł" has no decomposition, so "lukasz" never finds "Łukasz".
    it.skip('BUG: finds players with "ł" when searching without Polish letters', async () => {
      const { user } = setup(undefined, COACH, [makePlayer({ id: 9, firstName: 'Łukasz', lastName: 'Łukaszewski' })])
      await screen.findByText('Łukaszewski')

      await user.type(screen.getByPlaceholderText('Szukaj zawodnika...'), 'lukasz')

      expect(lastNames()).toEqual(['Łukaszewski'])
    })
  })

  describe('sorting', () => {
    it('sorts by last name ascending by default and reverses on click', async () => {
      const { user } = setup()
      await screen.findByText('Kowalski')
      expect(lastNames()).toEqual(['Kowalski', 'Nowak', 'Zieliński'])

      await user.click(screen.getByText('Nazwisko'))

      expect(lastNames()).toEqual(['Zieliński', 'Nowak', 'Kowalski'])
    })

    it('sorts by position, from goalkeepers to strikers', async () => {
      const { user } = setup()
      await screen.findByText('Kowalski')

      await user.click(screen.getByText('Pozycja', { selector: '.MuiTableSortLabel-root' }))

      expect(lastNames()).toEqual(['Nowak', 'Kowalski', 'Zieliński'])
    })

    it('sorts by shirt number, treating a missing number as zero', async () => {
      const { user } = setup()
      await screen.findByText('Kowalski')

      await user.click(screen.getByText('Numer', { selector: '.MuiTableSortLabel-root' }))

      expect(lastNames()).toEqual(['Zieliński', 'Nowak', 'Kowalski'])
    })

    it('sorts by age, youngest first', async () => {
      const { user } = setup()
      await screen.findByText('Kowalski')

      await user.click(screen.getByText('Data urodzenia (wiek)'))

      expect(lastNames()).toEqual(['Zieliński', 'Kowalski', 'Nowak'])
    })

    it('remembers the sorting', async () => {
      const { user } = setup()
      await screen.findByText('Kowalski')

      await user.click(screen.getByText('Numer', { selector: '.MuiTableSortLabel-root' }))

      expect(sessionStorage.getItem('players.sortField')).toBe('"jerseyNumber"')
    })
  })

  describe('archive tab', () => {
    it('lists only archived players with the date they were archived', async () => {
      const { user } = setup()
      await screen.findByText('Kowalski')

      await user.click(screen.getByRole('tab', { name: 'Archiwum (1)' }))

      expect(lastNames()).toEqual(['Timer'])
      expect(screen.getByText('W archiwum od')).toBeInTheDocument()
      expect(screen.getByText('2025-01-01')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Dodaj zawodnika' })).not.toBeInTheDocument()
    })

    it('says so when the archive is empty', async () => {
      const { user } = setup(undefined, COACH, roster().slice(0, 3))
      await screen.findByText('Kowalski')

      await user.click(screen.getByRole('tab', { name: 'Archiwum (0)' }))

      expect(screen.getByText('Brak zawodników w archiwum.')).toBeInTheDocument()
    })
  })
})

describe('permissions', () => {
  it('lets a coach add, edit and archive players', async () => {
    setup()
    await screen.findByText('Kowalski')

    expect(screen.getByRole('button', { name: 'Dodaj zawodnika' })).toBeInTheDocument()
    const row = within(rowOf('Kowalski'))
    expect(row.getByRole('button', { name: 'Edytuj' })).toBeInTheDocument()
    expect(row.getByRole('button', { name: 'Archiwizuj' })).toBeInTheDocument()
  })

  it('lets an assistant add and edit players, but not archive or delete them', async () => {
    setup(undefined, ASSISTANT)
    await screen.findByText('Kowalski')

    expect(screen.getByRole('button', { name: 'Dodaj zawodnika' })).toBeInTheDocument()
    const row = within(rowOf('Kowalski'))
    expect(row.getByRole('button', { name: 'Edytuj' })).toBeInTheDocument()
    expect(row.queryByRole('button', { name: 'Archiwizuj' })).not.toBeInTheDocument()
  })

  it('lets an assistant see the archive without any actions on it', async () => {
    const { user } = setup(undefined, ASSISTANT)
    await screen.findByText('Kowalski')

    await user.click(screen.getByRole('tab', { name: 'Archiwum (1)' }))

    expect(within(rowOf('Timer')).queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows an analyst the list without any editing controls', async () => {
    setup(undefined, ANALYST)
    await screen.findByText('Kowalski')

    expect(screen.queryByRole('button', { name: 'Dodaj zawodnika' })).not.toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Akcje' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edytuj' })).not.toBeInTheDocument()
  })
})

describe('adding a player', () => {
  async function fillRequired(user: ReturnType<typeof userEvent.setup>, dialog: HTMLElement) {
    await user.type(within(dialog).getByLabelText(/Imię/), 'Marek')
    await user.type(within(dialog).getByLabelText(/Nazwisko/), 'Lewy')
    fireEvent.change(within(dialog).getByLabelText(/Data urodzenia/), { target: { value: '1999-04-12' } })
    await user.click(within(dialog).getByRole('combobox', { name: /Pozycja/ }))
    await user.click(screen.getByRole('option', { name: 'Napastnik' }))
  }

  it('sends the new player with the coach team and reloads the list', async () => {
    const { user, backend } = setup()
    await screen.findByText('Kowalski')

    await user.click(screen.getByRole('button', { name: 'Dodaj zawodnika' }))
    const dialog = screen.getByRole('dialog')
    await fillRequired(user, dialog)
    await user.type(within(dialog).getByLabelText('Wzrost (cm)'), '185')
    await user.type(within(dialog).getByLabelText('Numer'), '9')
    await user.click(within(dialog).getByRole('combobox', { name: 'Noga' }))
    await user.click(screen.getByRole('option', { name: 'Lewa' }))
    await user.click(within(dialog).getByRole('combobox', { name: /Narodowość/ }))
    await user.click(screen.getByRole('option', { name: 'Polska' }))
    await user.click(within(dialog).getByRole('button', { name: 'Dodaj zawodnika' }))

    expect(await screen.findByText('Lewy')).toBeInTheDocument()
    expect(backend.created).toEqual([
      {
        firstName: 'Marek',
        lastName: 'Lewy',
        nationality: 'pl',
        dateOfBirth: '1999-04-12',
        position: 'ST',
        teamId: 1,
        heightCm: 185,
        jerseyNumber: 9,
        preferredFoot: 'Left',
        photoUrl: null,
      },
    ])
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('sends empty optional fields as null', async () => {
    const { user, backend } = setup()
    await screen.findByText('Kowalski')

    await user.click(screen.getByRole('button', { name: 'Dodaj zawodnika' }))
    const dialog = screen.getByRole('dialog')
    await fillRequired(user, dialog)
    await user.click(within(dialog).getByRole('button', { name: 'Dodaj zawodnika' }))

    await screen.findByText('Lewy')
    expect(backend.created[0]).toMatchObject({ nationality: null, heightCm: null, jerseyNumber: null, preferredFoot: null })
  })

  it('does not submit while required fields are empty', async () => {
    const { user, backend } = setup()
    await screen.findByText('Kowalski')

    await user.click(screen.getByRole('button', { name: 'Dodaj zawodnika' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Dodaj zawodnika' }))

    expect(backend.created).toEqual([])
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('shows the validation messages of the backend and keeps the form open', async () => {
    const { user } = setup({
      failOn: {
        create: Response.json(['Nieprawidłowy kod kraju.', 'Za wysoki wzrost.'], { status: 400 }),
      },
    })
    await screen.findByText('Kowalski')

    await user.click(screen.getByRole('button', { name: 'Dodaj zawodnika' }))
    const dialog = screen.getByRole('dialog')
    await fillRequired(user, dialog)
    await user.click(within(dialog).getByRole('button', { name: 'Dodaj zawodnika' }))

    expect(await within(dialog).findByText('Nieprawidłowy kod kraju. Za wysoki wzrost.')).toBeInTheDocument()
    expect(within(dialog).getByLabelText(/Imię/)).toHaveValue('Marek')
  })

  it('shows a generic message for other failures', async () => {
    const { user } = setup({ failOn: { create: new Response(null, { status: 500 }) } })
    await screen.findByText('Kowalski')

    await user.click(screen.getByRole('button', { name: 'Dodaj zawodnika' }))
    const dialog = screen.getByRole('dialog')
    await fillRequired(user, dialog)
    await user.click(within(dialog).getByRole('button', { name: 'Dodaj zawodnika' }))

    expect(await within(dialog).findByText('Nie udało się dodać zawodnika.')).toBeInTheDocument()
  })

  it('uploads a photo and sends its url with the player', async () => {
    const { user, backend } = setup()
    await screen.findByText('Kowalski')

    await user.click(screen.getByRole('button', { name: 'Dodaj zawodnika' }))
    const dialog = screen.getByRole('dialog')
    await fillRequired(user, dialog)
    await user.upload(
      dialog.querySelector('input[type="file"]') as HTMLInputElement,
      new File(['img'], 'me.png', { type: 'image/png' }),
    )
    await waitFor(() => expect(dialog.querySelector('img')).toHaveAttribute('src', 'http://localhost:5006/uploads/new-photo.png'))
    await user.click(within(dialog).getByRole('button', { name: 'Dodaj zawodnika' }))

    await screen.findByText('Lewy')
    expect(backend.created[0].photoUrl).toBe('/uploads/new-photo.png')
  })

  it('reports a failed photo upload', async () => {
    const { user } = setup({ failOn: { upload: new Response(null, { status: 400 }) } })
    await screen.findByText('Kowalski')

    await user.click(screen.getByRole('button', { name: 'Dodaj zawodnika' }))
    const dialog = screen.getByRole('dialog')
    await user.upload(
      dialog.querySelector('input[type="file"]') as HTMLInputElement,
      new File(['img'], 'me.png', { type: 'image/png' }),
    )

    expect(await within(dialog).findByText('Nie udało się wgrać zdjęcia.')).toBeInTheDocument()
  })

  it('closes without saving when cancelled', async () => {
    const { user, backend } = setup()
    await screen.findByText('Kowalski')

    await user.click(screen.getByRole('button', { name: 'Dodaj zawodnika' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Anuluj' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(backend.created).toEqual([])
  })
})

describe('editing a player', () => {
  it('prefills the form from the player', async () => {
    const { user } = setup()
    await screen.findByText('Kowalski')

    await user.click(within(rowOf('Kowalski')).getByRole('button', { name: 'Edytuj' }))

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByLabelText(/Imię/)).toHaveValue('Jan')
    expect(within(dialog).getByLabelText(/Nazwisko/)).toHaveValue('Kowalski')
    expect(within(dialog).getByLabelText(/Data urodzenia/)).toHaveValue('2000-01-10')
    expect(within(dialog).getByRole('combobox', { name: /Pozycja/ })).toHaveTextContent('Środkowy pomocnik')
    expect(within(dialog).getByLabelText('Wzrost (cm)')).toHaveValue(180)
    expect(within(dialog).getByLabelText('Numer')).toHaveValue(8)
    expect(within(dialog).getByRole('combobox', { name: 'Noga' })).toHaveTextContent('Prawa')
    expect(within(dialog).getByRole('combobox', { name: /Narodowość/ })).toHaveValue('Polska')
  })

  it('saves the changes and shows them in the list', async () => {
    const { user, backend } = setup()
    await screen.findByText('Kowalski')

    await user.click(within(rowOf('Kowalski')).getByRole('button', { name: 'Edytuj' }))
    const dialog = screen.getByRole('dialog')
    await user.clear(within(dialog).getByLabelText(/Nazwisko/))
    await user.type(within(dialog).getByLabelText(/Nazwisko/), 'Kowalczyk')
    await user.clear(within(dialog).getByLabelText('Numer'))
    await user.type(within(dialog).getByLabelText('Numer'), '10')
    await user.click(within(dialog).getByRole('button', { name: 'Zapisz zmiany' }))

    expect(await screen.findByText('Kowalczyk')).toBeInTheDocument()
    expect(screen.queryByText('Kowalski')).not.toBeInTheDocument()
    expect(backend.updated).toHaveLength(1)
    expect(backend.updated[0].id).toBe(1)
    expect(backend.updated[0].body).toMatchObject({
      firstName: 'Jan',
      lastName: 'Kowalczyk',
      jerseyNumber: 10,
      heightCm: 180,
      teamId: 1,
      nationality: 'pl',
      position: 'CM',
      preferredFoot: 'Right',
    })
  })

  it('clears the optional fields by sending null', async () => {
    const { user, backend } = setup()
    await screen.findByText('Kowalski')

    await user.click(within(rowOf('Kowalski')).getByRole('button', { name: 'Edytuj' }))
    const dialog = screen.getByRole('dialog')
    await user.clear(within(dialog).getByLabelText('Wzrost (cm)'))
    await user.clear(within(dialog).getByLabelText('Numer'))
    await user.click(within(dialog).getByRole('button', { name: 'Zapisz zmiany' }))

    await waitFor(() => expect(backend.updated).toHaveLength(1))
    expect(backend.updated[0].body).toMatchObject({ heightCm: null, jerseyNumber: null })
  })

  it('shows an error and keeps the form when saving fails', async () => {
    const { user } = setup({ failOn: { update: new Response(null, { status: 500 }) } })
    await screen.findByText('Kowalski')

    await user.click(within(rowOf('Kowalski')).getByRole('button', { name: 'Edytuj' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Zapisz zmiany' }))

    expect(await screen.findByText('Nie udało się zapisać zmian.')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('discards the changes when cancelled', async () => {
    const { user, backend } = setup()
    await screen.findByText('Kowalski')

    await user.click(within(rowOf('Kowalski')).getByRole('button', { name: 'Edytuj' }))
    await user.clear(within(screen.getByRole('dialog')).getByLabelText(/Nazwisko/))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Anuluj' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(backend.updated).toEqual([])
    expect(screen.getByText('Kowalski')).toBeInTheDocument()
  })

  it('changes the photo of a player', async () => {
    const { user, backend } = setup()
    await screen.findByText('Kowalski')

    await user.click(within(rowOf('Kowalski')).getByRole('button', { name: 'Edytuj' }))
    const dialog = screen.getByRole('dialog')
    await user.upload(
      dialog.querySelector('input[type="file"]') as HTMLInputElement,
      new File(['img'], 'me.png', { type: 'image/png' }),
    )
    await waitFor(() => expect(dialog.querySelector('img')).not.toBeNull())
    await user.click(within(dialog).getByRole('button', { name: 'Zapisz zmiany' }))

    await waitFor(() => expect(backend.updated).toHaveLength(1))
    expect(backend.updated[0].body.photoUrl).toBe('/uploads/new-photo.png')
  })
})

describe('archiving, restoring and deleting', () => {
  it('moves an archived player to the archive tab', async () => {
    const { user, backend } = setup()
    await screen.findByText('Kowalski')

    await user.click(within(rowOf('Kowalski')).getByRole('button', { name: 'Archiwizuj' }))

    expect(await screen.findByRole('tab', { name: 'Aktywni (2)' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Archiwum (2)' })).toBeInTheDocument()
    expect(screen.queryByText('Kowalski')).not.toBeInTheDocument()
    expect(backend.archived).toEqual([1])
  })

  it('reports a failed archiving', async () => {
    const { user } = setup({ failOn: { archive: new Response(null, { status: 500 }) } })
    await screen.findByText('Kowalski')

    await user.click(within(rowOf('Kowalski')).getByRole('button', { name: 'Archiwizuj' }))

    expect(await screen.findByText('Nie udało się przenieść zawodnika do archiwum.')).toBeInTheDocument()
    expect(screen.getByText('Kowalski')).toBeInTheDocument()
  })

  it('restores a player from the archive', async () => {
    const { user, backend } = setup()
    await screen.findByText('Kowalski')
    await user.click(screen.getByRole('tab', { name: 'Archiwum (1)' }))

    await user.click(within(rowOf('Timer')).getByRole('button', { name: 'Przywróć' }))

    expect(await screen.findByRole('tab', { name: 'Archiwum (0)' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Aktywni (4)' })).toBeInTheDocument()
    expect(backend.restored).toEqual([4])
  })

  it('reports a failed restore', async () => {
    const { user } = setup({ failOn: { restore: new Response(null, { status: 500 }) } })
    await screen.findByText('Kowalski')
    await user.click(screen.getByRole('tab', { name: 'Archiwum (1)' }))

    await user.click(within(rowOf('Timer')).getByRole('button', { name: 'Przywróć' }))

    expect(await screen.findByText('Nie udało się przywrócić zawodnika z archiwum.')).toBeInTheDocument()
  })

  it('asks for confirmation before deleting and deletes after it', async () => {
    const { user, backend } = setup()
    await screen.findByText('Kowalski')
    await user.click(screen.getByRole('tab', { name: 'Archiwum (1)' }))

    await user.click(within(rowOf('Timer')).getByRole('button', { name: 'Usuń trwale' }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Usunąć zawodnika trwale?')).toBeInTheDocument()
    expect(within(dialog).getByText('Zawodnik zostanie usunięty bezpowrotnie. Czy na pewno chcesz kontynuować?')).toBeInTheDocument()
    expect(backend.deleted).toEqual([])

    await user.click(within(dialog).getByRole('button', { name: 'Usuń' }))

    expect(await screen.findByRole('tab', { name: 'Archiwum (0)' })).toBeInTheDocument()
    expect(backend.deleted).toEqual([4])
  })

  it('warns that the reports of the player are deleted too', async () => {
    const { user } = setup({ impact: { 4: { appearances: 0, events: 0, reports: 3 } } })
    await screen.findByText('Kowalski')
    await user.click(screen.getByRole('tab', { name: 'Archiwum (1)' }))

    await user.click(within(rowOf('Timer')).getByRole('button', { name: 'Usuń trwale' }))

    expect(
      await screen.findByText('Zawodnik zostanie usunięty bezpowrotnie razem z raportami (3). Czy na pewno chcesz kontynuować?'),
    ).toBeInTheDocument()
  })

  it('does not delete when the confirmation is cancelled', async () => {
    const { user, backend } = setup()
    await screen.findByText('Kowalski')
    await user.click(screen.getByRole('tab', { name: 'Archiwum (1)' }))
    await user.click(within(rowOf('Timer')).getByRole('button', { name: 'Usuń trwale' }))

    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Anuluj' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(backend.deleted).toEqual([])
    expect(screen.getByText('Timer')).toBeInTheDocument()
  })

  it('refuses to delete a player with match data and explains why', async () => {
    const { user, backend } = setup({ impact: { 4: { appearances: 2, events: 5, reports: 0 } } })
    await screen.findByText('Kowalski')
    await user.click(screen.getByRole('tab', { name: 'Archiwum (1)' }))

    await user.click(within(rowOf('Timer')).getByRole('button', { name: 'Usuń trwale' }))

    expect(
      await screen.findByText('Zawodnik ma dane meczowe (występy: 2, zdarzenia: 5), więc musi zostać w archiwum.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(backend.deleted).toEqual([])
  })

  it('reports when the deletion impact cannot be checked', async () => {
    const { user } = setup({ failOn: { impact: new Response(null, { status: 500 }) } })
    await screen.findByText('Kowalski')
    await user.click(screen.getByRole('tab', { name: 'Archiwum (1)' }))

    await user.click(within(rowOf('Timer')).getByRole('button', { name: 'Usuń trwale' }))

    expect(await screen.findByText('Nie udało się sprawdzić skutków usunięcia zawodnika.')).toBeInTheDocument()
  })

  it("shows the server's explanation when the deletion is refused", async () => {
    const { user } = setup({
      failOn: { delete: new Response('Nie można usunąć zawodnika, który ma dane meczowe.', { status: 409 }) },
    })
    await screen.findByText('Kowalski')
    await user.click(screen.getByRole('tab', { name: 'Archiwum (1)' }))
    await user.click(within(rowOf('Timer')).getByRole('button', { name: 'Usuń trwale' }))

    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Usuń' }))

    expect(await screen.findByText('Nie można usunąć zawodnika, który ma dane meczowe.')).toBeInTheDocument()
  })

  it('shows a generic message when the deletion fails with a structured error', async () => {
    const { user } = setup({ failOn: { delete: Response.json({ title: 'Server error' }, { status: 500 }) } })
    await screen.findByText('Kowalski')
    await user.click(screen.getByRole('tab', { name: 'Archiwum (1)' }))
    await user.click(within(rowOf('Timer')).getByRole('button', { name: 'Usuń trwale' }))

    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Usuń' }))

    expect(await screen.findByText('Nie udało się usunąć zawodnika.')).toBeInTheDocument()
  })

  // axios gives "" as the body of a 500 without content, and handleDelete treats any string as the message,
  // so the (empty) message is falsy and nothing is shown to the user.
  it.skip('BUG: shows a message when the deletion fails with an empty response', async () => {
    const { user } = setup({ failOn: { delete: new Response(null, { status: 500 }) } })
    await screen.findByText('Kowalski')
    await user.click(screen.getByRole('tab', { name: 'Archiwum (1)' }))
    await user.click(within(rowOf('Timer')).getByRole('button', { name: 'Usuń trwale' }))

    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Usuń' }))

    expect(await screen.findByText('Nie udało się usunąć zawodnika.')).toBeInTheDocument()
  })
})
