import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TacticalBoard } from '@/components/tactics/TacticalBoard'
import { TacticalBoardTile } from '@/components/tactics/TacticalBoardTile'
import type { BoardObject, TacticalBoardData } from '@/types/tacticalBoard'
import { makeScheme } from '../../utils/factories'

const board = (objects: BoardObject[]): TacticalBoardData => ({ version: 1, objects })

const player: BoardObject = { id: 'p1', type: 'player', side: 'own', x: 0.5, y: 0.5, label: '7' }
const opponent: BoardObject = { id: 'p2', type: 'player', side: 'opponent', x: 0.25, y: 0.5, label: '3' }
const zone: BoardObject = { id: 'z1', type: 'zone', x: 0.1, y: 0.2, width: 0.3, height: 0.2, label: 'Strefa A' }
const runArrow: BoardObject = {
  id: 'a1', type: 'arrow', side: 'own', style: 'run', from: { x: 0.2, y: 0.2 }, to: { x: 0.4, y: 0.4 },
}
const passArrow: BoardObject = {
  id: 'a2', type: 'arrow', side: 'opponent', style: 'pass', from: { x: 0.2, y: 0.2 }, to: { x: 0.4, y: 0.4 },
}
const text: BoardObject = { id: 't1', type: 'text', x: 0.5, y: 0.1, text: 'Pressing' }

const objectIds = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('[data-object-id]')).map((el) => el.getAttribute('data-object-id'))

describe('TacticalBoard', () => {
  it('draws nothing but the pitch for an empty board', () => {
    const { container } = render(<TacticalBoard data={board([])} />)

    expect(objectIds(container)).toEqual([])
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('layers zones under arrows, arrows under players and players under texts', () => {
    const { container } = render(<TacticalBoard data={board([text, player, runArrow, zone])} />)

    expect(objectIds(container)).toEqual(['z1', 'a1', 'p1', 't1'])
  })

  it('does not reorder the data it is given', () => {
    const data = board([text, player, zone])

    render(<TacticalBoard data={data} />)

    expect(data.objects.map((o) => o.id)).toEqual(['t1', 'p1', 'z1'])
  })

  it('draws players at their position, in the colour of their side, with their label', () => {
    const { container } = render(<TacticalBoard data={board([player, opponent])} />)

    const own = container.querySelector('[data-object-id="p1"] circle')!
    expect(own).toHaveAttribute('cx', '34')
    expect(own).toHaveAttribute('cy', '52.5')
    expect(own).toHaveAttribute('fill', '#7c3aed')
    expect(container.querySelector('[data-object-id="p2"] circle')).toHaveAttribute('fill', '#dc2626')
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('draws zones with their label, and texts as given', () => {
    render(<TacticalBoard data={board([zone, text])} />)

    expect(screen.getByText('Strefa A')).toBeInTheDocument()
    expect(screen.getByText('Pressing')).toBeInTheDocument()
  })

  it('draws run arrows solid and pass arrows dashed, with an arrow head of their side', () => {
    const { container } = render(<TacticalBoard data={board([runArrow, passArrow])} />)

    const visibleLine = (id: string) => Array.from(container.querySelectorAll(`[data-object-id="${id}"] line`)).at(-1)!
    expect(visibleLine('a1')).not.toHaveAttribute('stroke-dasharray')
    expect(visibleLine('a1')).toHaveAttribute('marker-end', 'url(#board-arrow-own)')
    expect(visibleLine('a2')).toHaveAttribute('stroke-dasharray', '1.6 1.2')
    expect(visibleLine('a2')).toHaveAttribute('marker-end', 'url(#board-arrow-opponent)')
  })

  it('defines an arrow head for each side', () => {
    const { container } = render(<TacticalBoard data={board([])} />)

    expect(container.querySelector('marker#board-arrow-own')).not.toBeNull()
    expect(container.querySelector('marker#board-arrow-opponent')).not.toBeNull()
  })

  it('marks the selected object only', () => {
    const { container } = render(<TacticalBoard data={board([player, opponent])} selectedId="p1" />)

    expect(container.querySelectorAll('[data-object-id="p1"] circle')).toHaveLength(2)
    expect(container.querySelectorAll('[data-object-id="p2"] circle')).toHaveLength(1)
  })

  it('highlights a selected text', () => {
    const { container } = render(<TacticalBoard data={board([text])} selectedId="t1" />)

    expect(container.querySelector('text[data-object-id="t1"]')).toHaveAttribute('fill', '#fac775')
  })

  it('forwards pointer events and the svg reference', () => {
    const handlers = { onPointerDown: vi.fn(), onPointerMove: vi.fn(), onPointerUp: vi.fn() }
    const ref = { current: null as SVGSVGElement | null }
    const { container } = render(<TacticalBoard data={board([])} svgRef={ref} {...handlers} />)
    const svg = container.querySelector('svg')!

    fireEvent.pointerDown(svg)
    fireEvent.pointerMove(svg)
    fireEvent.pointerUp(svg)

    expect(handlers.onPointerDown).toHaveBeenCalledTimes(1)
    expect(handlers.onPointerMove).toHaveBeenCalledTimes(1)
    expect(handlers.onPointerUp).toHaveBeenCalledTimes(1)
    expect(ref.current).toBe(svg)
  })
})

describe('TacticalBoardTile', () => {
  const scheme = makeScheme({
    id: 4,
    name: 'Corner routine',
    data: JSON.stringify(board([player])),
    updatedAt: '2025-10-02T10:00:00Z',
  })

  function setup(canDelete = true, data = scheme) {
    const onOpen = vi.fn()
    const onDelete = vi.fn()
    const { container } = render(<TacticalBoardTile scheme={data} canDelete={canDelete} onOpen={onOpen} onDelete={onDelete} />)
    return { onOpen, onDelete, container, user: userEvent.setup() }
  }

  it('shows the name, the last update and a preview of the board', () => {
    const { container } = setup()
    const updated = new Date('2025-10-02T10:00:00Z').toLocaleString('pl-PL', { day: 'numeric', month: 'short' })

    expect(screen.getByText('Corner routine')).toBeInTheDocument()
    expect(screen.getByText(`Zaktualizowano: ${updated}`)).toBeInTheDocument()
    expect(container.querySelector('[data-object-id="p1"]')).not.toBeNull()
  })

  it('opens the scheme when clicked', async () => {
    const { user, onOpen } = setup()

    await user.click(screen.getByText('Corner routine'))

    expect(onOpen).toHaveBeenCalledWith(scheme)
  })

  it('deletes the scheme without opening it', async () => {
    const { user, onOpen, onDelete } = setup()

    await user.click(screen.getByLabelText('Usuń tablicę'))

    expect(onDelete).toHaveBeenCalledWith(scheme)
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('hides the delete button from users who cannot delete', () => {
    setup(false)

    expect(screen.queryByLabelText('Usuń tablicę')).not.toBeInTheDocument()
  })

  it('shows an empty board instead of crashing on unreadable data', () => {
    const { container } = setup(true, makeScheme({ data: 'not json' }))

    expect(screen.getByText('Corner routine')).toBeInTheDocument()
    expect(container.querySelectorAll('[data-object-id]')).toHaveLength(0)
  })
})
