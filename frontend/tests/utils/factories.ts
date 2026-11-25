import type { Kit } from '@/types/kit'
import type { Match } from '@/types/match'
import type { Player } from '@/types/player'
import type { Report } from '@/types/report'
import type { Team } from '@/types/team'
import type { TacticalScheme } from '@/types/tacticalScheme'
import type { TeamMatchResult } from '@/types/teamStats'
import type { UserSummary } from '@/types/user'

export function makeKit(overrides: Partial<Kit> = {}): Kit {
  return { pattern: 'Solid', primaryColor: '#112233', secondaryColor: '#ffffff', ...overrides }
}

export function makeTeam(overrides: Partial<Team> = {}): Team {
  return {
    id: 1,
    name: 'FC Test',
    countryCode: 'pl',
    league: 'Ekstraklasa',
    logoUrl: null,
    homeKit: makeKit(),
    awayKit: makeKit({ primaryColor: '#ffffff', secondaryColor: '#112233' }),
    goalkeeperKit: makeKit({ primaryColor: '#16a34a' }),
    ...overrides,
  }
}

export function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 1,
    firstName: 'Jan',
    lastName: 'Kowalski',
    nationality: 'pl',
    dateOfBirth: '2000-01-01',
    position: 'CM',
    teamId: 1,
    heightCm: 180,
    jerseyNumber: 8,
    preferredFoot: 'Right',
    photoUrl: null,
    archivedAt: null,
    ...overrides,
  }
}

export function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 1,
    date: '2025-10-05',
    status: 'Planned',
    opponent: 'Rival FC',
    season: '2025/26',
    teamId: 1,
    scoreFor: null,
    scoreAgainst: null,
    isHome: true,
    matchType: 'League',
    competition: null,
    round: '10',
    formation: '433',
    opponentLogoUrl: null,
    gamePlan: null,
    opponentNotes: null,
    ...overrides,
  }
}

export function makeReport(overrides: Partial<Report> = {}): Report {
  return {
    id: 1,
    title: 'Weekly review',
    content: 'Solid performance',
    priority: 'Normal',
    isRead: true,
    createdAt: '2025-10-05T12:00:00Z',
    playerId: null,
    playerName: null,
    playerPhotoUrl: null,
    teamId: 1,
    teamName: 'FC Test',
    teamLogoUrl: null,
    matchId: null,
    matchOpponent: null,
    matchDate: null,
    authorId: 'author-1',
    authorName: 'Anna Kowalska',
    canEdit: false,
    ...overrides,
  }
}

export function makeUser(overrides: Partial<UserSummary> = {}): UserSummary {
  return {
    id: 'user-1',
    email: 'user@test.local',
    roles: ['Coach'],
    teamId: 1,
    fullName: 'Jan Nowak',
    photoUrl: null,
    ...overrides,
  }
}

export function makeScheme(overrides: Partial<TacticalScheme> = {}): TacticalScheme {
  return {
    id: 1,
    name: 'Corner routine',
    data: JSON.stringify({ version: 1, objects: [] }),
    matchId: 1,
    reportId: null,
    createdAt: '2025-10-01T10:00:00Z',
    updatedAt: '2025-10-02T10:00:00Z',
    ...overrides,
  }
}

export function makeResult(overrides: Partial<TeamMatchResult> = {}): TeamMatchResult {
  return {
    matchId: 1,
    date: '2025-09-01',
    opponent: 'Rival FC',
    matchType: 'League',
    isHome: true,
    scoreFor: 2,
    scoreAgainst: 1,
    ...overrides,
  }
}
