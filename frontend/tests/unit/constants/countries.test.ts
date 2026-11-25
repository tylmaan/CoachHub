import { COUNTRIES } from '@/constants/countries'

describe('COUNTRIES', () => {
  it('uses unique two-letter lowercase codes (the format the backend validates)', () => {
    const codes = COUNTRIES.map((c) => c.code)

    expect(codes.every((code) => /^[a-z]{2}$/.test(code))).toBe(true)
    expect(new Set(codes).size).toBe(codes.length)
  })

  it('has a unique, non-empty name for every country', () => {
    const names = COUNTRIES.map((c) => c.name)

    expect(names.every((name) => name.trim().length > 0)).toBe(true)
    expect(new Set(names).size).toBe(names.length)
  })

  it('contains the countries the app relies on', () => {
    expect(COUNTRIES.find((c) => c.code === 'pl')?.name).toBe('Polska')
    expect(COUNTRIES.find((c) => c.code === 'gb')?.name).toBe('Wielka Brytania')
  })
})
