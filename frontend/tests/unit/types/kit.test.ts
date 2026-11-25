import { DEFAULT_KITS, KIT_PATTERNS, KIT_PATTERN_LABELS } from '@/types/kit'
import { targetFromKey } from '@/types/lineupDrag'

describe('kit constants', () => {
  it('labels every pattern', () => {
    expect(Object.keys(KIT_PATTERN_LABELS).sort()).toEqual([...KIT_PATTERNS].sort())
  })

  it('offers exactly the patterns the backend accepts', () => {
    expect([...KIT_PATTERNS].sort()).toEqual(
      ['Solid', 'HorizontalStripes', 'VerticalStripes', 'Halves', 'Sash', 'Quarters'].sort(),
    )
  })

  it('has valid default kits matching the backend defaults', () => {
    const { homeKit, awayKit, goalkeeperKit } = DEFAULT_KITS

    for (const kit of [homeKit, awayKit, goalkeeperKit]) {
      expect(KIT_PATTERNS).toContain(kit.pattern)
      expect(kit.primaryColor).toMatch(/^#[0-9a-f]{6}$/)
      expect(kit.secondaryColor).toMatch(/^#[0-9a-f]{6}$/)
    }
    expect(homeKit).toEqual({ pattern: 'Solid', primaryColor: '#7c3aed', secondaryColor: '#ffffff' })
    expect(awayKit).toEqual({ pattern: 'Solid', primaryColor: '#ffffff', secondaryColor: '#7c3aed' })
    expect(goalkeeperKit).toEqual({ pattern: 'Solid', primaryColor: '#16a34a', secondaryColor: '#ffffff' })
  })
})

describe('targetFromKey', () => {
  it('maps the bench key to the bench', () => {
    expect(targetFromKey('bench')).toEqual({ kind: 'bench' })
  })

  it('maps any other key to a pitch slot', () => {
    expect(targetFromKey('CB-1')).toEqual({ kind: 'pitch', slotKey: 'CB-1' })
  })
})
