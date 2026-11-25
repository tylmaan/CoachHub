import {
  createObject,
  createShape,
  isDrawTool,
  isTooSmall,
  lineupToPlayers,
  moveObject,
  newId,
  toBoardPoint,
} from '@/types/boardEditing'
import type { BoardArrow, BoardObject, BoardPlayer, BoardText, BoardZone } from '@/types/tacticalBoard'

const player = (overrides: Partial<BoardPlayer> = {}): BoardPlayer => ({
  id: 'p',
  type: 'player',
  side: 'own',
  x: 0.5,
  y: 0.5,
  label: '1',
  ...overrides,
})

const zone = (overrides: Partial<BoardZone> = {}): BoardZone => ({
  id: 'z',
  type: 'zone',
  x: 0.2,
  y: 0.2,
  width: 0.3,
  height: 0.3,
  label: 'Strefa',
  ...overrides,
})

const arrow = (overrides: Partial<BoardArrow> = {}): BoardArrow => ({
  id: 'a',
  type: 'arrow',
  side: 'own',
  style: 'run',
  from: { x: 0.2, y: 0.3 },
  to: { x: 0.6, y: 0.7 },
  ...overrides,
})

const text = (overrides: Partial<BoardText> = {}): BoardText => ({
  id: 't',
  type: 'text',
  x: 0.5,
  y: 0.5,
  text: 'Tekst',
  ...overrides,
})

describe('isDrawTool', () => {
  it('recognises the tools that are drawn by dragging', () => {
    expect(isDrawTool('run')).toBe(true)
    expect(isDrawTool('pass')).toBe(true)
    expect(isDrawTool('zone')).toBe(true)
  })

  it('rejects point tools and select', () => {
    expect(isDrawTool('ownPlayer')).toBe(false)
    expect(isDrawTool('opponentPlayer')).toBe(false)
    expect(isDrawTool('text')).toBe(false)
    expect(isDrawTool('select')).toBe(false)
  })
})

describe('toBoardPoint', () => {
  const svg = { getBoundingClientRect: () => ({ left: 10, top: 20, width: 200, height: 400 }) } as SVGSVGElement

  it('converts client coordinates into fractions of the board', () => {
    expect(toBoardPoint({ clientX: 110, clientY: 220 }, svg)).toEqual({ x: 0.5, y: 0.5 })
    expect(toBoardPoint({ clientX: 10, clientY: 20 }, svg)).toEqual({ x: 0, y: 0 })
    expect(toBoardPoint({ clientX: 210, clientY: 420 }, svg)).toEqual({ x: 1, y: 1 })
  })

  it('clamps points outside the board', () => {
    expect(toBoardPoint({ clientX: -500, clientY: 9999 }, svg)).toEqual({ x: 0, y: 1 })
  })

  it('rounds to four decimals', () => {
    expect(toBoardPoint({ clientX: 10 + 200 / 3, clientY: 20 + 400 / 3 }, svg)).toEqual({ x: 0.3333, y: 0.3333 })
  })
})

describe('moveObject', () => {
  it('moves players and texts by the given delta', () => {
    expect(moveObject(player(), 0.1, -0.1)).toMatchObject({ x: 0.6, y: 0.4 })
    expect(moveObject(text(), -0.2, 0.2)).toMatchObject({ x: 0.3, y: 0.7 })
  })

  it('keeps players and texts inside the margins', () => {
    expect(moveObject(player(), 1, 1)).toMatchObject({ x: 0.935, y: 0.955 })
    expect(moveObject(player(), -1, -1)).toMatchObject({ x: 0.065, y: 0.045 })
    expect(moveObject(text(), 1, 1)).toMatchObject({ x: 0.935, y: 0.955 })
  })

  it('keeps zones fully on the board', () => {
    expect(moveObject(zone(), 1, 1)).toMatchObject({ x: 0.7, y: 0.7 })
    expect(moveObject(zone(), -1, -1)).toMatchObject({ x: 0, y: 0 })
  })

  it('moves both ends of an arrow and stops when either end reaches the edge', () => {
    expect(moveObject(arrow(), 0.1, 0.1)).toMatchObject({ from: { x: 0.3, y: 0.4 }, to: { x: 0.7, y: 0.8 } })
    expect(moveObject(arrow(), 1, 1)).toMatchObject({ from: { x: 0.6, y: 0.6 }, to: { x: 1, y: 1 } })
    expect(moveObject(arrow(), -1, -1)).toMatchObject({ from: { x: 0, y: 0 }, to: { x: 0.4, y: 0.4 } })
  })

  it('rounds away floating point noise', () => {
    expect(moveObject(player({ x: 0.1, y: 0.1 }), 0.2, 0)).toMatchObject({ x: 0.3 })
  })

  it('does not mutate the original object', () => {
    const original = player()

    moveObject(original, 0.1, 0.1)

    expect(original).toMatchObject({ x: 0.5, y: 0.5 })
  })
})

describe('createObject', () => {
  it('creates a text object with a default caption', () => {
    const created = createObject('text', { x: 0.4, y: 0.6 }, [])

    expect(created).toMatchObject({ type: 'text', x: 0.4, y: 0.6, text: 'Tekst' })
    expect(created.id).toBeTruthy()
  })

  it('creates own and opponent players on the right side', () => {
    expect(createObject('ownPlayer', { x: 0.5, y: 0.5 }, [])).toMatchObject({ type: 'player', side: 'own' })
    expect(createObject('opponentPlayer', { x: 0.5, y: 0.5 }, [])).toMatchObject({ type: 'player', side: 'opponent' })
  })

  it('pulls points near the edge inside the margins', () => {
    expect(createObject('ownPlayer', { x: 0, y: 1 }, [])).toMatchObject({ x: 0.065, y: 0.955 })
    expect(createObject('text', { x: 1, y: 0 }, [])).toMatchObject({ x: 0.935, y: 0.045 })
  })

  it('numbers players per side, filling the first free number', () => {
    const objects: BoardObject[] = [
      player({ id: '1', side: 'own', label: '1' }),
      player({ id: '2', side: 'own', label: '2' }),
      player({ id: '4', side: 'own', label: '4' }),
      player({ id: 'o1', side: 'opponent', label: '1' }),
      player({ id: 'o3', side: 'opponent', label: '3' }),
    ]

    expect((createObject('ownPlayer', { x: 0.5, y: 0.5 }, objects) as BoardPlayer).label).toBe('3')
    expect((createObject('opponentPlayer', { x: 0.5, y: 0.5 }, objects) as BoardPlayer).label).toBe('2')
  })

  it('starts numbering at 1 and ignores non-player objects', () => {
    const objects: BoardObject[] = [zone(), arrow(), text({ text: '1' })]

    expect((createObject('ownPlayer', { x: 0.5, y: 0.5 }, objects) as BoardPlayer).label).toBe('1')
  })

  it('gives every object a different id', () => {
    const first = createObject('ownPlayer', { x: 0.5, y: 0.5 }, [])
    const second = createObject('ownPlayer', { x: 0.5, y: 0.5 }, [])

    expect(first.id).not.toBe(second.id)
  })
})

describe('createShape', () => {
  it('creates a zone regardless of the drag direction', () => {
    const forward = createShape('zone', 'z', { x: 0.2, y: 0.3 }, { x: 0.6, y: 0.7 })
    const backward = createShape('zone', 'z', { x: 0.6, y: 0.7 }, { x: 0.2, y: 0.3 })

    expect(forward).toEqual({ id: 'z', type: 'zone', x: 0.2, y: 0.3, width: 0.4, height: 0.4, label: 'Strefa' })
    expect(backward).toEqual(forward)
  })

  it('rounds zone sizes', () => {
    expect(createShape('zone', 'z', { x: 0.1, y: 0.1 }, { x: 0.4, y: 0.4 })).toMatchObject({ width: 0.3, height: 0.3 })
  })

  it.each(['run', 'pass'] as const)('creates an own-side %s arrow keeping the drag direction', (style) => {
    expect(createShape(style, 'a', { x: 0.6, y: 0.7 }, { x: 0.2, y: 0.3 })).toEqual({
      id: 'a',
      type: 'arrow',
      side: 'own',
      style,
      from: { x: 0.6, y: 0.7 },
      to: { x: 0.2, y: 0.3 },
    })
  })
})

describe('isTooSmall', () => {
  it('rejects zones thinner than the minimum in either direction', () => {
    expect(isTooSmall(zone({ width: 0.019, height: 0.5 }))).toBe(true)
    expect(isTooSmall(zone({ width: 0.5, height: 0.019 }))).toBe(true)
    expect(isTooSmall(zone({ width: 0.02, height: 0.02 }))).toBe(false)
  })

  it('rejects arrows shorter than the minimum length', () => {
    expect(isTooSmall(arrow({ from: { x: 0.5, y: 0.5 }, to: { x: 0.52, y: 0.5 } }))).toBe(true)
    expect(isTooSmall(arrow({ from: { x: 0.5, y: 0.5 }, to: { x: 0.5, y: 0.5 } }))).toBe(true)
    expect(isTooSmall(arrow({ from: { x: 0.5, y: 0.5 }, to: { x: 0.53, y: 0.5 } }))).toBe(false)
  })

  it('never rejects players or texts', () => {
    expect(isTooSmall(player())).toBe(false)
    expect(isTooSmall(text())).toBe(false)
  })
})

describe('lineupToPlayers', () => {
  it('turns lineup slots into own players with unique ids', () => {
    const players = lineupToPlayers([
      { label: 'GK', x: 0.5, y: 0.9 },
      { label: 'ST', x: 0.5, y: 0.1 },
    ])

    expect(players).toHaveLength(2)
    expect(players[0]).toMatchObject({ type: 'player', side: 'own', x: 0.5, y: 0.9, label: 'GK' })
    expect(players[1]).toMatchObject({ type: 'player', side: 'own', x: 0.5, y: 0.1, label: 'ST' })
    expect(players[0].id).not.toBe(players[1].id)
  })

  it('returns nothing for an empty lineup', () => {
    expect(lineupToPlayers([])).toEqual([])
  })
})

describe('newId', () => {
  it('returns a different non-empty id on every call', () => {
    const ids = new Set(Array.from({ length: 50 }, () => newId()))

    expect(ids.size).toBe(50)
    expect([...ids].every((id) => id.length > 0)).toBe(true)
  })

  it('falls back to a time-based id when crypto.randomUUID is unavailable', () => {
    vi.stubGlobal('crypto', {})

    const id = newId()

    expect(id).toMatch(/^[a-z0-9]+-[a-z0-9]+$/)
    vi.unstubAllGlobals()
  })
})
