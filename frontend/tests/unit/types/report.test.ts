import {
  REPORT_KIND_LABELS,
  REPORT_PRIORITY_LABELS,
  reportKind,
  reportSubject,
} from '@/types/report'

describe('reportKind', () => {
  it.each([
    [1, 5, 'PlayerMatch'],
    [1, null, 'PlayerGeneral'],
    [null, 5, 'TeamMatch'],
    [null, null, 'TeamGeneral'],
  ] as const)('player %s, match %s -> %s', (playerId, matchId, kind) => {
    expect(reportKind({ playerId, matchId })).toBe(kind)
  })

  it('treats a player id of 0 as a player (not as missing)', () => {
    expect(reportKind({ playerId: 0, matchId: null })).toBe('PlayerGeneral')
  })

  it('produces only kinds the backend filter understands', () => {
    expect(Object.keys(REPORT_KIND_LABELS).sort()).toEqual(
      ['PlayerGeneral', 'PlayerMatch', 'TeamGeneral', 'TeamMatch'],
    )
  })
})

describe('reportSubject', () => {
  it('shows the player and the opponent for a player match report', () => {
    expect(reportSubject({ playerName: 'Jan Kowalski', teamName: null, matchOpponent: 'Rival FC' })).toBe(
      'Jan Kowalski vs Rival FC',
    )
  })

  it('shows the team and the opponent for a team match report', () => {
    expect(reportSubject({ playerName: null, teamName: 'FC Test', matchOpponent: 'Rival FC' })).toBe(
      'FC Test vs Rival FC',
    )
  })

  it('appends "raport" when the report is not about a match', () => {
    expect(reportSubject({ playerName: 'Jan Kowalski', teamName: null, matchOpponent: null })).toBe(
      'Jan Kowalski - raport',
    )
    expect(reportSubject({ playerName: null, teamName: 'FC Test', matchOpponent: null })).toBe('FC Test - raport')
  })

  it('prefers the player over the team', () => {
    expect(reportSubject({ playerName: 'Jan Kowalski', teamName: 'FC Test', matchOpponent: null })).toBe(
      'Jan Kowalski - raport',
    )
  })
})

describe('priority labels', () => {
  it('labels exactly the priorities the backend accepts', () => {
    expect(Object.keys(REPORT_PRIORITY_LABELS).sort()).toEqual(['High', 'Low', 'Normal'])
  })
})
