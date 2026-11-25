import {
  countdownLabel,
  daysUntil,
  matchTypeLabel,
  nextMatches,
  parseMatchDate,
  roundLabel,
} from '@/types/matchSchedule'
import { makeMatch } from '../../utils/factories'

function isoDay(offsetDays: number) {
  const d = new Date(2025, 5, 15 + offsetDays)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2025, 5, 15, 22, 30))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('daysUntil', () => {
  it('counts whole calendar days, ignoring the time of day', () => {
    expect(daysUntil(isoDay(0))).toBe(0)
    expect(daysUntil(isoDay(1))).toBe(1)
    expect(daysUntil(isoDay(7))).toBe(7)
  })

  it('is negative for past dates', () => {
    expect(daysUntil(isoDay(-1))).toBe(-1)
    expect(daysUntil(isoDay(-30))).toBe(-30)
  })

  it('works across month and year boundaries', () => {
    expect(daysUntil('2025-07-01')).toBe(16)
    expect(daysUntil('2026-01-01')).toBe(200)
  })
})

describe('countdownLabel', () => {
  it.each([
    [-3, 'po terminie'],
    [-1, 'po terminie'],
    [0, 'dzisiaj'],
    [1, 'jutro'],
    [2, 'za 2 dni'],
    [30, 'za 30 dni'],
  ])('%i days -> %s', (days, label) => {
    expect(countdownLabel(days)).toBe(label)
  })
})

describe('nextMatches', () => {
  it('keeps only upcoming planned matches, soonest first, limited to the requested count', () => {
    const matches = [
      makeMatch({ id: 1, date: isoDay(10) }),
      makeMatch({ id: 2, date: isoDay(2) }),
      makeMatch({ id: 3, date: isoDay(-2) }),
      makeMatch({ id: 4, date: isoDay(5), status: 'Played', scoreFor: 1, scoreAgainst: 0 }),
      makeMatch({ id: 5, date: isoDay(0) }),
      makeMatch({ id: 6, date: isoDay(20) }),
    ]

    expect(nextMatches(matches, 3).map((m) => m.id)).toEqual([5, 2, 1])
  })

  it('returns an empty list when nothing is upcoming', () => {
    expect(nextMatches([makeMatch({ date: isoDay(-5) })], 3)).toEqual([])
    expect(nextMatches([], 3)).toEqual([])
  })

  it('does not reorder the input array', () => {
    const matches = [makeMatch({ id: 1, date: isoDay(9) }), makeMatch({ id: 2, date: isoDay(1) })]

    nextMatches(matches, 2)

    expect(matches.map((m) => m.id)).toEqual([1, 2])
  })
})

describe('matchTypeLabel', () => {
  it('shows the team league for league matches, falling back to the generic label', () => {
    expect(matchTypeLabel(makeMatch({ matchType: 'League' }), 'Ekstraklasa')).toBe('Ekstraklasa')
    expect(matchTypeLabel(makeMatch({ matchType: 'League' }), null)).toBe('Ligowy')
  })

  it('shows the competition for cup matches, falling back to the generic label', () => {
    expect(matchTypeLabel(makeMatch({ matchType: 'Cup', competition: 'Puchar Polski' }), 'Ekstraklasa')).toBe('Puchar Polski')
    expect(matchTypeLabel(makeMatch({ matchType: 'Cup', competition: null }), null)).toBe('Pucharowy')
  })

  it('translates other known types and passes unknown ones through', () => {
    expect(matchTypeLabel(makeMatch({ matchType: 'Friendly' }), null)).toBe('Towarzyski')
    expect(matchTypeLabel(makeMatch({ matchType: 'Exhibition' }), null)).toBe('Exhibition')
  })

  it('shows a dash when the type is not set', () => {
    expect(matchTypeLabel(makeMatch({ matchType: null }), 'Ekstraklasa')).toBe('-')
  })
})

describe('parseMatchDate', () => {
  it('builds a local date without timezone shifts', () => {
    const date = parseMatchDate('2025-03-09')

    expect(date.getFullYear()).toBe(2025)
    expect(date.getMonth()).toBe(2)
    expect(date.getDate()).toBe(9)
    expect(date.getHours()).toBe(0)
  })
})

describe('roundLabel', () => {
  it('is null without a round', () => {
    expect(roundLabel(makeMatch({ round: null }))).toBeNull()
    expect(roundLabel(makeMatch({ round: '' }))).toBeNull()
  })

  it('prefixes league rounds with "kolejka"', () => {
    expect(roundLabel(makeMatch({ matchType: 'League', round: '12' }))).toBe('kolejka 12')
  })

  it('shows the round of other competitions as is', () => {
    expect(roundLabel(makeMatch({ matchType: 'Cup', round: 'Półfinał' }))).toBe('Półfinał')
  })
})
