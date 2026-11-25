import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  COMPETITIONS,
  categoryOfMatch,
  groupCompetitions,
} from '@/constants/competitions'
import { COUNTRIES } from '@/constants/countries'

describe('categoryOfMatch', () => {
  it('treats league and friendly match types as such, regardless of competition', () => {
    expect(categoryOfMatch('League', null)).toBe('league')
    expect(categoryOfMatch('League', 'Puchar Polski')).toBe('league')
    expect(categoryOfMatch('Friendly', null)).toBe('friendly')
  })

  it('uses the category of a known competition', () => {
    expect(categoryOfMatch('Cup', 'Puchar Polski')).toBe('cup')
    expect(categoryOfMatch('Cup', 'Liga Mistrzów')).toBe('international')
    expect(categoryOfMatch('Cup', 'Liga Europy')).toBe('international')
  })

  it('falls back to cup for an unknown or missing competition', () => {
    expect(categoryOfMatch('Cup', 'Nieznany Puchar')).toBe('cup')
    expect(categoryOfMatch('Cup', null)).toBe('cup')
    expect(categoryOfMatch(null, null)).toBe('cup')
  })
})

describe('groupCompetitions', () => {
  it('lists every country that has competitions, plus the international group, when no country is chosen', () => {
    const groups = groupCompetitions(null)

    expect(groups.map((g) => g.key)).toEqual(['pl', 'gb', 'international'])
    expect(groups.find((g) => g.key === 'pl')?.label).toBe('Polska')
    expect(groups.find((g) => g.key === 'gb')?.label).toBe('Wielka Brytania')
  })

  it('narrows to the chosen country but always keeps the international group', () => {
    const groups = groupCompetitions('pl')

    expect(groups.map((g) => g.key)).toEqual(['pl', 'international'])
    expect(groups[0].names).toEqual(['Puchar Polski', 'Superpuchar Polski'])
  })

  it('returns only international competitions for a country without domestic cups', () => {
    const groups = groupCompetitions('de')

    expect(groups).toHaveLength(1)
    expect(groups[0]).toMatchObject({ key: 'international', category: 'international', label: 'Międzynarodowe' })
    expect(groups[0].names).toEqual(['Liga Mistrzów', 'Liga Europy', 'Liga Konferencji Europy'])
  })

  it('labels domestic groups as cups', () => {
    expect(groupCompetitions('gb')[0].category).toBe('cup')
  })
})

describe('competition data', () => {
  it('only references existing country codes', () => {
    const codes = new Set(COUNTRIES.map((c) => c.code))
    for (const competition of COMPETITIONS) {
      if (competition.country !== null) expect(codes.has(competition.country), competition.name).toBe(true)
    }
  })

  it('has unique competition names', () => {
    const names = COMPETITIONS.map((c) => c.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('has a label and colors for every category', () => {
    for (const category of ['league', 'cup', 'international', 'friendly'] as const) {
      expect(CATEGORY_LABELS[category]).toBeTruthy()
      expect(CATEGORY_COLORS[category].bg).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(CATEGORY_COLORS[category].fg).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(CATEGORY_COLORS[category].bar).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
  })
})
