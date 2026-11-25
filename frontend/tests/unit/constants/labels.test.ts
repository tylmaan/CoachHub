import {
  EVENT_TYPE_LABELS,
  FOOT_LABELS,
  MATCH_TYPE_LABELS,
  POSITIONS,
  POSITION_GROUPS,
  POSITION_LABELS,
  ROLE_CHIP_COLORS,
  ROLE_FILTERS,
  ROLE_FILTER_LABELS,
  ROLE_LABELS,
} from '@/constants/labels'
import { FORMATIONS } from '@/constants/formations'
import { SAVE_STATUS_LABELS, SIDE_COLORS, SIDE_LABELS } from '@/constants/tacticalBoard'
import { leaguesOf, LEAGUES } from '@/constants/leagues'
import { COUNTRIES } from '@/constants/countries'

describe('role labels', () => {
  it('labels every role the backend knows', () => {
    expect(Object.keys(ROLE_LABELS).sort()).toEqual(['Admin', 'AssistantCoach', 'Analyst', 'Coach'].sort())
  })

  it('has a label for every role filter', () => {
    for (const filter of ROLE_FILTERS) expect(ROLE_FILTER_LABELS[filter]).toBeTruthy()
  })

  it('only colours roles that have a label', () => {
    for (const role of Object.keys(ROLE_CHIP_COLORS)) expect(ROLE_LABELS[role]).toBeTruthy()
  })
})

describe('positions', () => {
  it('has a label for every position', () => {
    for (const position of POSITIONS) expect(POSITION_LABELS[position], position).toBeTruthy()
    expect(Object.keys(POSITION_LABELS).sort()).toEqual([...POSITIONS].sort())
  })

  it('groups every position exactly once', () => {
    const grouped = POSITION_GROUPS.flatMap((group) => group.codes)

    expect([...grouped].sort()).toEqual([...POSITIONS].sort())
  })

  it('covers every position used by the formations', () => {
    const used = new Set(Object.values(FORMATIONS).flatMap((slots) => slots.map(([position]) => position)))

    for (const position of used) expect(POSITIONS, position).toContain(position)
  })
})

describe('event type labels', () => {
  it('covers every event type the statistics rely on', () => {
    const counted = ['Goal', 'PenaltyGoal', 'OwnGoal', 'Assist', 'YellowCard', 'RedCard', 'SubstitutionIn', 'SubstitutionOff']

    for (const type of counted) expect(EVENT_TYPE_LABELS[type], type).toBeTruthy()
  })
})

describe('other label sets', () => {
  it('labels the foot and match type values sent to the backend', () => {
    expect(Object.keys(FOOT_LABELS).sort()).toEqual(['Both', 'Left', 'Right'])
    expect(Object.keys(MATCH_TYPE_LABELS).sort()).toEqual(['Cup', 'Friendly', 'League'])
  })
})

describe('tactical board constants', () => {
  it('labels and colours both sides', () => {
    for (const side of ['own', 'opponent'] as const) {
      expect(SIDE_LABELS[side]).toBeTruthy()
      expect(SIDE_COLORS[side].fill).toMatch(/^#/)
      expect(SIDE_COLORS[side].arrow).toMatch(/^#/)
    }
  })

  it('has a message for every save status', () => {
    for (const status of ['saved', 'pending', 'saving', 'error'] as const) {
      expect(SAVE_STATUS_LABELS[status]).toBeTruthy()
    }
  })
})

describe('leaguesOf', () => {
  it('returns the leagues of a country', () => {
    expect(leaguesOf('pl')).toEqual(['Ekstraklasa', 'I Liga', 'II Liga', 'III Liga'])
    expect(leaguesOf('gb')[0]).toBe('Premier League')
  })

  it('returns an empty list without a country or for a country without leagues', () => {
    expect(leaguesOf(null)).toEqual([])
    expect(leaguesOf('de')).toEqual([])
  })

  it('only defines leagues for existing countries', () => {
    const codes = new Set(COUNTRIES.map((c) => c.code))

    for (const code of Object.keys(LEAGUES)) expect(codes.has(code), code).toBe(true)
  })
})
