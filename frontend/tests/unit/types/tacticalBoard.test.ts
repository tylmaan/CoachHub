import { EMPTY_BOARD, parseBoardData } from '@/types/tacticalBoard'

describe('parseBoardData', () => {
  it('parses a valid board', () => {
    const board = {
      version: 1,
      objects: [{ id: 'a', type: 'player', side: 'own', x: 0.5, y: 0.5, label: '1' }],
    }

    expect(parseBoardData(JSON.stringify(board))).toEqual(board)
  })

  it('accepts an empty board', () => {
    expect(parseBoardData('{"version":1,"objects":[]}')).toEqual(EMPTY_BOARD)
  })

  it.each([
    ['not json', 'not json'],
    ['empty string', ''],
    ['null', 'null'],
    ['an array', '[1,2,3]'],
    ['a string', '"board"'],
    ['an unknown version', '{"version":2,"objects":[]}'],
    ['a missing version', '{"objects":[]}'],
    ['objects that are not an array', '{"version":1,"objects":{}}'],
    ['missing objects', '{"version":1}'],
  ])('falls back to the empty board for %s', (_name, json) => {
    expect(parseBoardData(json)).toEqual(EMPTY_BOARD)
  })

  it('keeps the empty board empty', () => {
    expect(EMPTY_BOARD).toEqual({ version: 1, objects: [] })
  })
})
