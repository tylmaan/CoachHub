import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { TacticalBoardSection } from '@/components/tactics/TacticalBoardSection'
import type { TacticalScheme } from '@/types/tacticalScheme'
import { makeScheme } from '../utils/factories'
import { fakeResource } from '../utils/fakeResource'
import { API, server } from '../mocks/server'
import { DESKTOP, setViewportWidth } from '../utils/viewport'

type Props = Parameters<typeof TacticalBoardSection>[0]

function setup(
  schemes: TacticalScheme[] = [],
  props: Partial<Props> = {},
  options?: Parameters<typeof fakeResource>[2],
  owner: Props['owner'] = { kind: 'match', id: 5 },
) {
  setViewportWidth(DESKTOP)
  const listPath = `/tacticalschemes/${owner.kind}/${owner.id}`
  let items = schemes.map((s) => ({ ...s }))
  const state = { created: [] as unknown[], deleted: [] as number[], lists: 0 }

  server.use(
    http.get(`${API}${listPath}`, () => {
      state.lists += 1
      return options?.failOn?.list?.clone() ?? HttpResponse.json(items)
    }),
    http.post(`${API}${listPath}`, async ({ request }) => {
      if (options?.failOn?.create) return options.failOn.create.clone()
      const body = (await request.json()) as { name: string; data: string }
      state.created.push(body)
      const created = makeScheme({ id: 500 + state.created.length, ...body, matchId: owner.kind === 'match' ? owner.id : null, reportId: owner.kind === 'report' ? owner.id : null })
      items = [...items, created]
      return HttpResponse.json(created, { status: 201 })
    }),
    http.delete(`${API}/tacticalschemes/:id`, ({ params }) => {
      if (options?.failOn?.delete) return options.failOn.delete.clone()
      state.deleted.push(Number(params.id))
      items = items.filter((s) => s.id !== Number(params.id))
      return new HttpResponse(null, { status: 204 })
    }),
    http.put(`${API}/tacticalschemes/:id`, () => new HttpResponse(null, { status: 204 })),
  )

  render(<TacticalBoardSection owner={owner} canEdit canDelete {...props} />)
  return { state, user: userEvent.setup({ delay: null }) }
}

const schemes = () => [
  makeScheme({ id: 1, name: 'Corner routine' }),
  makeScheme({ id: 2, name: 'High press' }),
]

describe('listing boards', () => {
  it('shows a tile for every board', async () => {
    setup(schemes())

    expect(await screen.findByText('Corner routine')).toBeInTheDocument()
    expect(screen.getByText('High press')).toBeInTheDocument()
  })

  it('uses "Taktyka" as the default title, or the given one', async () => {
    setup(schemes(), { title: 'Tablice raportu' })

    expect(await screen.findByText('Tablice raportu')).toBeInTheDocument()
  })

  it('shows an error when the boards cannot be loaded', async () => {
    setup([], {}, { failOn: { list: new Response(null, { status: 500 }) } })

    expect(await screen.findByText('Nie udało się pobrać tablic taktycznych.')).toBeInTheDocument()
  })

  it('offers a card for a new board to editors', async () => {
    setup(schemes())

    expect(await screen.findByText('Nowa tablica')).toBeInTheDocument()
    expect(screen.queryByText('Brak tablic taktycznych.')).not.toBeInTheDocument()
  })

  it('shows read-only users the boards without the new board card', async () => {
    setup(schemes(), { canEdit: false, canDelete: false })

    expect(await screen.findByText('Corner routine')).toBeInTheDocument()
    expect(screen.queryByText('Nowa tablica')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Usuń tablicę')).not.toBeInTheDocument()
  })

  it('tells read-only users when there are no boards', async () => {
    setup([], { canEdit: false })

    expect(await screen.findByText('Brak tablic taktycznych.')).toBeInTheDocument()
  })

  it('loads the boards of a report from the report endpoint', async () => {
    setup([makeScheme({ id: 9, name: 'Report board', matchId: null, reportId: 3 })], {}, undefined, { kind: 'report', id: 3 })

    expect(await screen.findByText('Report board')).toBeInTheDocument()
  })
})

describe('creating a board', () => {
  async function openDialog(user: ReturnType<typeof userEvent.setup>) {
    await screen.findByText('Nowa tablica')
    await user.click(screen.getByText('Nowa tablica'))
    return screen.getByRole('dialog')
  }

  it('creates an empty board with the given name', async () => {
    const { user, state } = setup(schemes())
    const dialog = await openDialog(user)

    await user.type(within(dialog).getByLabelText('Nazwa'), '  Throw-in  ')
    await user.click(within(dialog).getByRole('button', { name: 'Utwórz' }))

    expect(await screen.findByText('Throw-in')).toBeInTheDocument()
    expect(state.created).toEqual([{ name: 'Throw-in', data: '{"version":1,"objects":[]}' }])
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('creates a board for a report', async () => {
    const { user, state } = setup([], {}, undefined, { kind: 'report', id: 3 })
    const dialog = await openDialog(user)

    await user.type(within(dialog).getByLabelText('Nazwa'), 'Scouting')
    await user.click(within(dialog).getByRole('button', { name: 'Utwórz' }))

    await waitFor(() => expect(state.created).toHaveLength(1))
  })

  it('does not allow an empty or blank name', async () => {
    const { user, state } = setup()
    const dialog = await openDialog(user)
    const create = within(dialog).getByRole('button', { name: 'Utwórz' })
    expect(create).toBeDisabled()

    await user.type(within(dialog).getByLabelText('Nazwa'), '   ')

    expect(create).toBeDisabled()
    expect(state.created).toEqual([])
  })

  it('limits the name to 100 characters', async () => {
    const { user } = setup()
    const dialog = await openDialog(user)

    expect(within(dialog).getByLabelText('Nazwa')).toHaveAttribute('maxlength', '100')
  })

  it('reports a failure and keeps the dialog', async () => {
    const { user } = setup([], {}, { failOn: { create: new Response(null, { status: 500 }) } })
    const dialog = await openDialog(user)
    await user.type(within(dialog).getByLabelText('Nazwa'), 'Throw-in')

    await user.click(within(dialog).getByRole('button', { name: 'Utwórz' }))

    expect(await within(dialog).findByText('Nie udało się dodać tablicy.')).toBeInTheDocument()
  })

  it('forgets the typed name when cancelled', async () => {
    const { user } = setup()
    const dialog = await openDialog(user)
    await user.type(within(dialog).getByLabelText('Nazwa'), 'Draft')
    await user.click(within(dialog).getByRole('button', { name: 'Anuluj' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    await user.click(screen.getByText('Nowa tablica'))

    expect(within(screen.getByRole('dialog')).getByLabelText('Nazwa')).toHaveValue('')
  })
})

describe('deleting a board', () => {
  async function openConfirmation(user: ReturnType<typeof userEvent.setup>) {
    await screen.findByText('Corner routine')
    await user.click(screen.getAllByLabelText('Usuń tablicę')[0])
    return screen.findByRole('dialog')
  }

  it('names the board in the confirmation and deletes it', async () => {
    const { user, state } = setup(schemes())

    const dialog = await openConfirmation(user)
    expect(within(dialog).getByText('Usunąć tablicę?')).toBeInTheDocument()
    expect(within(dialog).getByText('Tablica „Corner routine” zostanie usunięta bezpowrotnie.')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Usuń' }))

    await waitFor(() => expect(screen.queryByText('Corner routine')).not.toBeInTheDocument())
    expect(state.deleted).toEqual([1])
    expect(screen.getByText('High press')).toBeInTheDocument()
  })

  it('does not delete when cancelled', async () => {
    const { user, state } = setup(schemes())
    const dialog = await openConfirmation(user)

    await user.click(within(dialog).getByRole('button', { name: 'Anuluj' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(state.deleted).toEqual([])
    expect(screen.getByText('Corner routine')).toBeInTheDocument()
  })

  it('reports a failed deletion and keeps the board', async () => {
    const { user } = setup(schemes(), {}, { failOn: { delete: new Response(null, { status: 500 }) } })
    const dialog = await openConfirmation(user)

    await user.click(within(dialog).getByRole('button', { name: 'Usuń' }))

    expect(await screen.findByText('Nie udało się usunąć tablicy.')).toBeInTheDocument()
    expect(screen.getByText('Corner routine')).toBeInTheDocument()
  })

  it('offers deleting only to those allowed to', async () => {
    setup(schemes(), { canDelete: false })

    expect(await screen.findByText('Corner routine')).toBeInTheDocument()
    expect(screen.queryByLabelText('Usuń tablicę')).not.toBeInTheDocument()
  })
})

describe('opening a board', () => {
  it('opens the editor for the board', async () => {
    const { user } = setup(schemes(), { canEdit: true })
    await user.click(await screen.findByText('High press'))

    expect(await screen.findByLabelText('Nazwa tablicy')).toHaveValue('High press')
  })

  it('opens a read-only view for users who cannot edit', async () => {
    const { user } = setup(schemes(), { canEdit: false, canDelete: false })
    await user.click(await screen.findByText('High press'))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('High press')).toBeInTheDocument()
    expect(within(dialog).queryByLabelText('Nazwa tablicy')).not.toBeInTheDocument()
  })

  it('reloads the boards when the editor is closed', async () => {
    const { user, state } = setup(schemes())
    await user.click(await screen.findByText('High press'))
    await screen.findByLabelText('Nazwa tablicy')
    const loadsBefore = state.lists

    await user.click(screen.getByRole('button', { name: 'Zamknij' }))

    await waitFor(() => expect(state.lists).toBe(loadsBefore + 1))
    await waitFor(() => expect(screen.queryByLabelText('Nazwa tablicy')).not.toBeInTheDocument())
  })
})
