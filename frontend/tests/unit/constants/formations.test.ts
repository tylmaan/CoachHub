import { FORMATIONS, FORMATION_LABELS } from '@/constants/formations'

const keys = Object.keys(FORMATIONS)

describe('formations', () => {
  it('has a label for every formation and no label without a formation', () => {
    expect(Object.keys(FORMATION_LABELS).sort()).toEqual([...keys].sort())
  })

  it.each(keys)('%s: label is the formation digits joined by dashes', (key) => {
    expect(FORMATION_LABELS[key]).toBe(key.split('').join('-'))
  })

  it.each(keys)('%s: has eleven slots with exactly one goalkeeper', (key) => {
    const slots = FORMATIONS[key]

    expect(slots).toHaveLength(11)
    expect(slots.filter(([position]) => position === 'GK')).toHaveLength(1)
  })

  it.each(keys)('%s: outfield players match the formation digits', (key) => {
    const digitSum = key.split('').reduce((sum, digit) => sum + Number(digit), 0)

    expect(FORMATIONS[key].length - 1).toBe(digitSum)
  })

  it.each(keys)('%s: every slot lies inside the pitch and no two slots overlap', (key) => {
    const slots = FORMATIONS[key]

    for (const [, x, y] of slots) {
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThanOrEqual(100)
      expect(y).toBeGreaterThanOrEqual(0)
      expect(y).toBeLessThanOrEqual(100)
    }

    const coordinates = slots.map(([, x, y]) => `${x},${y}`)
    expect(new Set(coordinates).size).toBe(coordinates.length)
  })

  it.each(keys)('%s: the goalkeeper is the deepest slot', (key) => {
    const slots = FORMATIONS[key]
    const goalkeeperY = slots.find(([position]) => position === 'GK')![2]

    expect(Math.max(...slots.map(([, , y]) => y))).toBe(goalkeeperY)
  })
})
