import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { TacticalBoardEditor } from '@/components/tactics/TacticalBoardEditor'
import type { BoardObject, TacticalBoardData } from '@/types/tacticalBoard'
import { makeScheme } from '../utils/factories'
import { mockApi } from '../utils/mockApi'
import { API, server } from '../mocks/server'
import { DESKTOP, setViewportWidth } from '../utils/viewport'

const WIDTH = 680
const HEIGHT = 1050

const player = (id: string, x: number, y: number, label: string, side: 'own' | 'opponent' = 'own'): BoardObject => ({
  id, type: 'player', side, x, y, label,
})

function schemeWith(objects: BoardObject[], name = 'Corner routine') {
  const data: TacticalBoardData = { version: 1, objects }
  return makeScheme({ id: 7, name, data: JSON.stringify(data) })
}

function setup(
  objects: BoardObject[] = [],
  props: Partial<Parameters<typeof TacticalBoardEditor>[0]> = {},
  scheme = schemeWith(objects),
) {
  setViewportWidth(DESKTOP)
  const save = mockApi('put', '/tacticalschemes/7')
  const onClose = vi.fn()
  render(<TacticalBoardEditor scheme={scheme} canEdit onClose={onClose} {...props} />)
  return { save, onClose, user: userEvent.setup({ delay: null }) }
}

const board = () => document.querySelector('svg[viewBox="0 0 68 105"]') as SVGSVGElement
const objectIds = () => Array.from(board().querySelectorAll('[data-object-id]')).map((el) => el.getAttribute('data-object-id'))
const objectEl = (id: string) => board().querySelector(`[data-object-id="${id}"]`) as SVGElement
const at = (x: number, y: number) => ({ clientX: x * WIDTH, clientY: y * HEIGHT, pointerId: 1 })
const panel = () => screen.getByText('Usuń').closest('.MuiPaper-root') as HTMLElement
const savedObjects = (body: unknown) => JSON.parse((body as { data: string }).data).objects as BoardObject[]

beforeEach(() => {
  const original = Element.prototype.getBoundingClientRect
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    if (this instanceof SVGSVGElement) {
      return { left: 0, top: 0, right: WIDTH, bottom: HEIGHT, width: WIDTH, height: HEIGHT, x: 0, y: 0, toJSON: () => ({}) }
    }
    return original.call(this)
  })
})

function click(point: { x: number; y: number }, target: Element = board()) {
  fireEvent.pointerDown(target, at(point.x, point.y))
  fireEvent.pointerUp(board(), at(point.x, point.y))
}

function drag(from: { x: number; y: number }, to: { x: number; y: number }, target: Element = board()) {
  fireEvent.pointerDown(target, at(from.x, from.y))
  fireEvent.pointerMove(board(), at(to.x, to.y))
  fireEvent.pointerUp(board(), at(to.x, to.y))
}

describe('the editor window', () => {
  it('shows the name, the tools and an empty board', () => {
    setup()

    expect(screen.getByLabelText('Nazwa tablicy')).toHaveValue('Corner routine')
    for (const tool of ['Zaznacz', 'Nasz zawodnik', 'Rywal', 'Tekst', 'Bieg', 'Podanie', 'Strefa']) {
      expect(screen.getByRole('button', { name: tool })).toBeInTheDocument()
    }
    expect(screen.getByText('Zaznacz obiekt na boisku albo wybierz narzędzie i kliknij boisko.')).toBeInTheDocument()
    expect(screen.getByText('Zapisano automatycznie')).toBeInTheDocument()
    expect(objectIds()).toEqual([])
  })

  it('starts with the select tool, and nothing to undo or redo', () => {
    setup()

    expect(screen.getByRole('button', { name: 'Zaznacz' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('Cofnij')).toBeDisabled()
    expect(screen.getByLabelText('Ponów')).toBeDisabled()
  })

  it('shows the objects of the saved board', () => {
    setup([player('p1', 0.5, 0.5, '7')])

    expect(objectIds()).toEqual(['p1'])
    expect(within(objectEl('p1') as unknown as HTMLElement).getByText('7')).toBeInTheDocument()
  })

  it('opens an empty board when the saved data is unreadable', () => {
    setup([], {}, makeScheme({ id: 7, data: 'not json' }))

    expect(objectIds()).toEqual([])
  })
})

describe('placing objects', () => {
  it('places our players, numbering them 1, 2, 3...', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Nasz zawodnik' }))

    click({ x: 0.3, y: 0.5 })
    click({ x: 0.6, y: 0.5 })

    const labels = Array.from(board().querySelectorAll('[data-object-id] text')).map((t) => t.textContent)
    expect(labels).toEqual(['1', '2'])
  })

  it('numbers opponents separately from our players', async () => {
    const { user } = setup([player('own1', 0.2, 0.2, '1')])
    await user.click(screen.getByRole('button', { name: 'Rywal' }))

    click({ x: 0.6, y: 0.5 })

    const opponent = Array.from(board().querySelectorAll('[data-object-id]')).find((el) => el.getAttribute('data-object-id') !== 'own1')!
    expect(opponent.querySelector('text')).toHaveTextContent('1')
    expect(opponent.querySelector('circle:last-of-type')).toHaveAttribute('fill', '#dc2626')
  })

  it('selects the new object and shows its properties', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Nasz zawodnik' }))

    click({ x: 0.5, y: 0.5 })

    expect(within(panel()).getByText('Zawodnik')).toBeInTheDocument()
    expect(within(panel()).getByLabelText('Numer')).toHaveValue('1')
  })

  it('keeps objects placed near the edge inside the pitch', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Nasz zawodnik' }))

    click({ x: 0, y: 0 })

    const circle = board().querySelector('[data-object-id] circle:last-of-type')!
    expect(Number(circle.getAttribute('cx'))).toBeCloseTo(0.065 * 68, 2)
    expect(Number(circle.getAttribute('cy'))).toBeCloseTo(0.045 * 105, 2)
  })

  it('places a text with a default caption', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Tekst' }))

    click({ x: 0.5, y: 0.3 })

    expect(board().querySelector('text[data-object-id]')).toHaveTextContent('Tekst')
    expect(within(panel()).getByLabelText('Treść')).toHaveValue('Tekst')
  })

  it.each([
    ['Bieg', 'run'],
    ['Podanie', 'pass'],
  ])('draws a %s arrow by dragging', async (tool, style) => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: tool }))

    drag({ x: 0.2, y: 0.2 }, { x: 0.5, y: 0.6 })

    expect(objectIds()).toHaveLength(1)
    const lines = board().querySelectorAll('[data-object-id] line')
    const visible = lines[lines.length - 1]
    expect(visible.hasAttribute('stroke-dasharray')).toBe(style === 'pass')
    expect(within(panel()).getByText('Strzałka')).toBeInTheDocument()
  })

  it('shows the arrow while it is being drawn', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Bieg' }))

    fireEvent.pointerDown(board(), at(0.2, 0.2))
    fireEvent.pointerMove(board(), at(0.5, 0.6))

    expect(objectIds()).toHaveLength(1)
    fireEvent.pointerUp(board(), at(0.5, 0.6))
    expect(objectIds()).toHaveLength(1)
  })

  it('draws a zone by dragging in any direction', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Strefa' }))

    drag({ x: 0.6, y: 0.6 }, { x: 0.2, y: 0.3 })

    expect(objectIds()).toHaveLength(1)
    const rect = board().querySelector('[data-object-id] rect')!
    expect(Number(rect.getAttribute('x'))).toBeCloseTo(0.2 * 68, 2)
    expect(Number(rect.getAttribute('width'))).toBeCloseTo(0.4 * 68, 2)
    expect(board()).toHaveTextContent('Strefa')
  })

  it('ignores a drag that is too short to be an arrow or a zone', async () => {
    const { user, save } = setup()
    await user.click(screen.getByRole('button', { name: 'Bieg' }))
    drag({ x: 0.5, y: 0.5 }, { x: 0.51, y: 0.5 })
    await user.click(screen.getByRole('button', { name: 'Strefa' }))
    drag({ x: 0.5, y: 0.5 }, { x: 0.51, y: 0.51 })

    expect(objectIds()).toEqual([])
    expect(save.calls).toBe(0)
  })
})

describe('selecting and moving', () => {
  it('selects an object by clicking it', async () => {
    setup([player('p1', 0.5, 0.5, '7'), player('p2', 0.2, 0.2, '9')])

    click({ x: 0.5, y: 0.5 }, objectEl('p1').querySelector('circle')!)

    expect(within(panel()).getByLabelText('Numer')).toHaveValue('7')
    expect(objectEl('p1').querySelectorAll('circle')).toHaveLength(2)
    expect(objectEl('p2').querySelectorAll('circle')).toHaveLength(1)
  })

  it('clears the selection by clicking an empty spot', () => {
    setup([player('p1', 0.5, 0.5, '7')])
    click({ x: 0.5, y: 0.5 }, objectEl('p1').querySelector('circle')!)

    click({ x: 0.9, y: 0.9 })

    expect(screen.getByText('Zaznacz obiekt na boisku albo wybierz narzędzie i kliknij boisko.')).toBeInTheDocument()
  })

  it('moves an object by dragging it, keeping it on the pitch', async () => {
    const { save } = setup([player('p1', 0.5, 0.5, '7')])

    drag({ x: 0.5, y: 0.5 }, { x: 0.7, y: 0.6 }, objectEl('p1').querySelector('circle')!)

    const circle = objectEl('p1').querySelector('circle:last-of-type')!
    expect(Number(circle.getAttribute('cx'))).toBeCloseTo(0.7 * 68, 1)
    expect(Number(circle.getAttribute('cy'))).toBeCloseTo(0.6 * 105, 1)
    await waitFor(() => expect(save.calls).toBe(1), { timeout: 3000 })
    expect(savedObjects(save.body)[0]).toMatchObject({ id: 'p1', x: 0.7, y: 0.6 })
  })

  it('shows the object following the pointer before it is dropped', () => {
    setup([player('p1', 0.5, 0.5, '7')])

    fireEvent.pointerDown(objectEl('p1').querySelector('circle')!, at(0.5, 0.5))
    fireEvent.pointerMove(board(), at(0.8, 0.8))

    const circle = objectEl('p1').querySelector('circle:last-of-type')!
    expect(Number(circle.getAttribute('cx'))).toBeCloseTo(0.8 * 68, 1)
    fireEvent.pointerUp(board(), at(0.8, 0.8))
  })

  it('does not move an object that was only clicked', async () => {
    const { save } = setup([player('p1', 0.5, 0.5, '7')])

    drag({ x: 0.5, y: 0.5 }, { x: 0.5005, y: 0.5 }, objectEl('p1').querySelector('circle')!)

    expect(save.calls).toBe(0)
    expect(screen.getByLabelText('Cofnij')).toBeDisabled()
  })

  it('does not let an object leave the pitch', () => {
    setup([player('p1', 0.5, 0.5, '7')])

    drag({ x: 0.5, y: 0.5 }, { x: 5, y: 5 }, objectEl('p1').querySelector('circle')!)

    const circle = objectEl('p1').querySelector('circle:last-of-type')!
    expect(Number(circle.getAttribute('cx'))).toBeCloseTo(0.935 * 68, 1)
    expect(Number(circle.getAttribute('cy'))).toBeCloseTo(0.955 * 105, 1)
  })
})

describe('editing the selected object', () => {
  it('changes the number of a player', async () => {
    const { user, save } = setup([player('p1', 0.5, 0.5, '7')])
    click({ x: 0.5, y: 0.5 }, objectEl('p1').querySelector('circle')!)

    const field = within(panel()).getByLabelText('Numer')
    await user.clear(field)
    await user.type(field, '10')
    await user.tab()

    expect(objectEl('p1').querySelector('text')).toHaveTextContent('10')
    await waitFor(() => expect(save.calls).toBe(1), { timeout: 3000 })
    expect(savedObjects(save.body)[0]).toMatchObject({ label: '10' })
  })

  it('keeps the old number when the field is emptied', async () => {
    const { user } = setup([player('p1', 0.5, 0.5, '7')])
    click({ x: 0.5, y: 0.5 }, objectEl('p1').querySelector('circle')!)

    const field = within(panel()).getByLabelText('Numer')
    await user.clear(field)
    await user.tab()

    expect(within(panel()).getByLabelText('Numer')).toHaveValue('7')
    expect(objectEl('p1').querySelector('text')).toHaveTextContent('7')
  })

  it('applies a field with the Enter key', async () => {
    const { user } = setup([player('p1', 0.5, 0.5, '7')])
    click({ x: 0.5, y: 0.5 }, objectEl('p1').querySelector('circle')!)

    const field = within(panel()).getByLabelText('Numer')
    await user.clear(field)
    await user.type(field, '4{Enter}')

    expect(objectEl('p1').querySelector('text')).toHaveTextContent('4')
  })

  it('limits the number to three characters', () => {
    setup([player('p1', 0.5, 0.5, '7')])
    click({ x: 0.5, y: 0.5 }, objectEl('p1').querySelector('circle')!)

    expect(within(panel()).getByLabelText('Numer')).toHaveAttribute('maxlength', '3')
  })

  it('switches a player to the other side', async () => {
    const { user } = setup([player('p1', 0.5, 0.5, '7')])
    click({ x: 0.5, y: 0.5 }, objectEl('p1').querySelector('circle')!)

    await user.click(within(panel()).getByRole('button', { name: 'Rywal' }))

    expect(objectEl('p1').querySelector('circle:last-of-type')).toHaveAttribute('fill', '#dc2626')
  })

  it('changes the text of a text object', async () => {
    const { user } = setup([{ id: 't1', type: 'text', x: 0.5, y: 0.3, text: 'Presing' }])
    click({ x: 0.5, y: 0.3 }, board().querySelector('text[data-object-id="t1"]')!)

    const field = within(panel()).getByLabelText('Treść')
    await user.clear(field)
    await user.type(field, 'Pressing{Enter}')

    expect(board().querySelector('text[data-object-id="t1"]')).toHaveTextContent('Pressing')
  })

  it('renames a zone', async () => {
    const { user } = setup([{ id: 'z1', type: 'zone', x: 0.2, y: 0.2, width: 0.3, height: 0.2, label: 'Strefa' }])
    click({ x: 0.3, y: 0.3 }, objectEl('z1').querySelector('rect')!)

    const field = within(panel()).getByLabelText('Nazwa')
    await user.clear(field)
    await user.type(field, 'Wolna przestrzeń{Enter}')

    expect(board()).toHaveTextContent('Wolna przestrzeń')
  })

  it('changes the style and the side of an arrow', async () => {
    const { user } = setup([
      { id: 'a1', type: 'arrow', side: 'own', style: 'run', from: { x: 0.2, y: 0.2 }, to: { x: 0.6, y: 0.6 } },
    ])
    click({ x: 0.4, y: 0.4 }, objectEl('a1').querySelector('line')!)

    await user.click(within(panel()).getByRole('button', { name: 'Podanie' }))
    await user.click(within(panel()).getByRole('button', { name: 'Rywal' }))

    const lines = objectEl('a1').querySelectorAll('line')
    const visible = lines[lines.length - 1]
    expect(visible).toHaveAttribute('stroke-dasharray')
    expect(visible).toHaveAttribute('marker-end', 'url(#board-arrow-opponent)')
  })
})

describe('deleting, undoing and redoing', () => {
  it('deletes the selected object with the button', async () => {
    const { user } = setup([player('p1', 0.5, 0.5, '7'), player('p2', 0.2, 0.2, '9')])
    click({ x: 0.5, y: 0.5 }, objectEl('p1').querySelector('circle')!)

    await user.click(within(panel()).getByRole('button', { name: 'Usuń' }))

    expect(objectIds()).toEqual(['p2'])
    expect(screen.getByText('Zaznacz obiekt na boisku albo wybierz narzędzie i kliknij boisko.')).toBeInTheDocument()
  })

  it.each(['Delete', 'Backspace'])('deletes the selected object with the %s key', (key) => {
    setup([player('p1', 0.5, 0.5, '7')])
    click({ x: 0.5, y: 0.5 }, objectEl('p1').querySelector('circle')!)

    fireEvent.keyDown(document.body, { key })

    expect(objectIds()).toEqual([])
  })

  it('does not delete the object while typing in a field', () => {
    setup([player('p1', 0.5, 0.5, '7')])
    click({ x: 0.5, y: 0.5 }, objectEl('p1').querySelector('circle')!)

    fireEvent.keyDown(within(panel()).getByLabelText('Numer'), { key: 'Backspace' })

    expect(objectIds()).toEqual(['p1'])
  })

  it('undoes and redoes with the buttons', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Nasz zawodnik' }))
    click({ x: 0.5, y: 0.5 })
    expect(objectIds()).toHaveLength(1)

    await user.click(screen.getByLabelText('Cofnij'))
    expect(objectIds()).toHaveLength(0)
    expect(screen.getByLabelText('Cofnij')).toBeDisabled()

    await user.click(screen.getByLabelText('Ponów'))
    expect(objectIds()).toHaveLength(1)
    expect(screen.getByLabelText('Ponów')).toBeDisabled()
  })

  it('undoes and redoes with the keyboard', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Nasz zawodnik' }))
    click({ x: 0.5, y: 0.5 })

    fireEvent.keyDown(document.body, { key: 'z', ctrlKey: true })
    expect(objectIds()).toHaveLength(0)

    fireEvent.keyDown(document.body, { key: 'y', ctrlKey: true })
    expect(objectIds()).toHaveLength(1)

    fireEvent.keyDown(document.body, { key: 'z', ctrlKey: true })
    fireEvent.keyDown(document.body, { key: 'z', ctrlKey: true, shiftKey: true })
    expect(objectIds()).toHaveLength(1)
  })

  it('undoes the removal of an object', async () => {
    const { user } = setup([player('p1', 0.5, 0.5, '7')])
    click({ x: 0.5, y: 0.5 }, objectEl('p1').querySelector('circle')!)
    await user.click(within(panel()).getByRole('button', { name: 'Usuń' }))

    await user.click(screen.getByLabelText('Cofnij'))

    expect(objectIds()).toEqual(['p1'])
  })
})

describe('inserting the planned lineup', () => {
  const lineup = [
    { label: '1', x: 0.5, y: 0.9 },
    { label: '9', x: 0.5, y: 0.1 },
  ]

  it('offers no such button without a lineup', () => {
    setup()

    expect(screen.queryByText('Wstaw skład')).not.toBeInTheDocument()
  })

  it('replaces our players with the lineup and keeps everything else', async () => {
    const { user } = setup(
      [
        player('own1', 0.3, 0.3, '5'),
        player('opp1', 0.6, 0.6, '3', 'opponent'),
        { id: 't1', type: 'text', x: 0.5, y: 0.5, text: 'Note' },
      ],
      { lineup },
    )

    await user.click(screen.getByText('Wstaw skład'))

    const ids = objectIds()
    expect(ids).not.toContain('own1')
    expect(ids).toContain('opp1')
    expect(ids).toContain('t1')
    expect(ids).toHaveLength(4)
    const labels = Array.from(board().querySelectorAll('text')).map((t) => t.textContent)
    expect(labels).toEqual(expect.arrayContaining(['1', '9', '3', 'Note']))
  })

  it('can be undone', async () => {
    const { user } = setup([player('own1', 0.3, 0.3, '5')], { lineup })
    await user.click(screen.getByText('Wstaw skład'))

    await user.click(screen.getByLabelText('Cofnij'))

    expect(objectIds()).toEqual(['own1'])
  })
})

describe('saving', () => {
  it('saves changes automatically with the name and the board', async () => {
    const { user, save } = setup()
    await user.click(screen.getByRole('button', { name: 'Nasz zawodnik' }))

    click({ x: 0.5, y: 0.5 })
    expect(screen.getByText('Zapisywanie...')).toBeInTheDocument()

    await waitFor(() => expect(save.calls).toBe(1), { timeout: 3000 })
    expect(save.body).toMatchObject({ name: 'Corner routine' })
    expect(savedObjects(save.body)).toHaveLength(1)
    expect(JSON.parse((save.body as { data: string }).data).version).toBe(1)
    await waitFor(() => expect(screen.getByText('Zapisano automatycznie')).toBeInTheDocument())
  })

  it('saves a new name', async () => {
    const { user, save } = setup()
    const name = screen.getByLabelText('Nazwa tablicy')

    await user.clear(name)
    await user.type(name, 'Free kick{Enter}')

    await waitFor(() => expect(save.calls).toBe(1), { timeout: 3000 })
    expect(save.body).toMatchObject({ name: 'Free kick' })
  })

  it('keeps the old name when the field is emptied', async () => {
    const { user, save } = setup()
    const name = screen.getByLabelText('Nazwa tablicy')

    await user.clear(name)
    await user.tab()

    expect(screen.getByLabelText('Nazwa tablicy')).toHaveValue('Corner routine')
    expect(save.calls).toBe(0)
  })

  it('closes right away when nothing changed', async () => {
    const { user, onClose } = setup()

    await user.click(screen.getByRole('button', { name: 'Zamknij' }))

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  })

  it('saves pending changes before closing', async () => {
    const { user, save, onClose } = setup()
    await user.click(screen.getByRole('button', { name: 'Nasz zawodnik' }))
    click({ x: 0.5, y: 0.5 })

    await user.click(screen.getByRole('button', { name: 'Zamknij' }))

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(save.calls).toBe(1)
  })

  it('also saves before closing with the Escape key', async () => {
    const { user, save, onClose } = setup()
    await user.click(screen.getByRole('button', { name: 'Nasz zawodnik' }))
    click({ x: 0.5, y: 0.5 })

    await user.keyboard('{Escape}')

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(save.calls).toBe(1)
  })

  describe('when saving fails', () => {
    function failingSave() {
      let failures = 1
      let calls = 0
      server.use(
        http.put(`${API}/tacticalschemes/7`, () => {
          calls += 1
          return failures-- > 0 ? new HttpResponse(null, { status: 500 }) : new HttpResponse(null, { status: 204 })
        }),
      )
      return () => calls
    }

    it('reports the error and offers to retry or to close without saving', async () => {
      const { user, onClose } = setup()
      const calls = failingSave()
      await user.click(screen.getByRole('button', { name: 'Nasz zawodnik' }))
      click({ x: 0.5, y: 0.5 })

      expect(await screen.findByText('Nie udało się zapisać zmian', {}, { timeout: 3000 })).toBeInTheDocument()
      expect(screen.getByText('Ponów', { selector: 'button' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Zamknij' })).not.toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Zamknij bez zapisu' }))
      expect(onClose).toHaveBeenCalledTimes(1)
      expect(calls()).toBe(1)
    })

    it('saves after retrying', async () => {
      const { user } = setup()
      failingSave()
      await user.click(screen.getByRole('button', { name: 'Nasz zawodnik' }))
      click({ x: 0.5, y: 0.5 })
      await screen.findByText('Nie udało się zapisać zmian', {}, { timeout: 3000 })

      await user.click(screen.getByText('Ponów', { selector: 'button' }))

      expect(await screen.findByText('Zapisano automatycznie')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Zamknij' })).toBeInTheDocument()
    })
  })
})

describe('read-only mode', () => {
  it('shows only the name and the board', () => {
    setup([player('p1', 0.5, 0.5, '7')], { canEdit: false })

    expect(screen.getByText('Corner routine')).toBeInTheDocument()
    expect(screen.queryByLabelText('Nazwa tablicy')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Nasz zawodnik' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Cofnij')).not.toBeInTheDocument()
    expect(screen.queryByText('Zapisano automatycznie')).not.toBeInTheDocument()
    expect(objectIds()).toEqual(['p1'])
  })

  it('ignores clicks on the board and keyboard shortcuts', () => {
    const { save } = setup([player('p1', 0.5, 0.5, '7')], { canEdit: false })

    click({ x: 0.5, y: 0.5 }, objectEl('p1').querySelector('circle')!)
    drag({ x: 0.5, y: 0.5 }, { x: 0.8, y: 0.8 }, objectEl('p1').querySelector('circle')!)
    fireEvent.keyDown(document.body, { key: 'Delete' })

    expect(objectIds()).toEqual(['p1'])
    expect(save.calls).toBe(0)
  })

  it('closes right away', async () => {
    const { user, onClose } = setup([], { canEdit: false })

    await user.click(screen.getByRole('button', { name: 'Zamknij' }))

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  })
})
