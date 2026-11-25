import {
  createMatch,
  deleteMatch,
  getMatch,
  getMatches,
  updateGamePlan,
  updateMatch,
  updateOpponentNotes,
} from '@/api/matchesApi'
import {
  archivePlayer,
  createPlayer,
  deletePlayer,
  getPlayerDeletionImpact,
  getPlayers,
  restorePlayer,
  updatePlayer,
} from '@/api/playersApi'
import { createTeam, deleteTeam, getTeams, updateTeam } from '@/api/teamsApi'
import {
  createMatchAppearance,
  deleteMatchAppearance,
  getMatchAppearances,
  updateMatchAppearance,
} from '@/api/matchAppearancesApi'
import {
  createMatchEvent,
  deleteMatchEvent,
  getMatchEvents,
  updateMatchEvent,
} from '@/api/matchEventsApi'
import { deleteUser, getUsers, updateUser } from '@/api/usersApi'
import { getPlayerStats } from '@/api/playerStatsApi'
import { getTeamStats } from '@/api/teamStatsApi'
import { makeMatch, makePlayer, makeTeam, makeUser } from '../../utils/factories'
import { mockApi } from '../../utils/mockApi'
import { omit } from '../../utils/omit'

describe('matchesApi', () => {
  const request = omit(makeMatch(), 'id', 'gamePlan', 'opponentNotes')

  it('lists matches', async () => {
    mockApi('get', '/matches', [makeMatch({ id: 1 }), makeMatch({ id: 2 })])

    expect((await getMatches()).map((m) => m.id)).toEqual([1, 2])
  })

  it('loads one match', async () => {
    mockApi('get', '/matches/5', makeMatch({ id: 5 }))

    expect((await getMatch(5)).id).toBe(5)
  })

  it('creates a match and returns it', async () => {
    const captured = mockApi('post', '/matches', makeMatch({ id: 9 }))

    expect((await createMatch(request)).id).toBe(9)
    expect(captured.body).toEqual(request)
  })

  it('updates a match', async () => {
    const captured = mockApi('put', '/matches/5')

    await updateMatch(5, request)

    expect(captured.body).toEqual(request)
  })

  it('saves the game plan and the opponent notes as { text }', async () => {
    const plan = mockApi('put', '/matches/5/game-plan')
    const notes = mockApi('put', '/matches/5/opponent-notes')

    await updateGamePlan(5, 'Press high')
    await updateOpponentNotes(5, null)

    expect(plan.body).toEqual({ text: 'Press high' })
    expect(notes.body).toEqual({ text: null })
  })

  it('deletes a match', async () => {
    const captured = mockApi('delete', '/matches/5')

    await deleteMatch(5)

    expect(captured.calls).toBe(1)
  })
})

describe('playersApi', () => {
  const request = omit(makePlayer(), 'id', 'archivedAt')

  it('lists players', async () => {
    mockApi('get', '/players', [makePlayer({ id: 1 }), makePlayer({ id: 2 })])

    expect((await getPlayers()).map((p) => p.id)).toEqual([1, 2])
  })

  it('creates and updates a player', async () => {
    const created = mockApi('post', '/players', makePlayer({ id: 7 }))
    const updated = mockApi('put', '/players/7')

    expect((await createPlayer(request)).id).toBe(7)
    await updatePlayer(7, request)

    expect(created.body).toEqual(request)
    expect(updated.body).toEqual(request)
  })

  it('archives, restores and deletes a player', async () => {
    const archive = mockApi('post', '/players/7/archive')
    const restore = mockApi('post', '/players/7/restore')
    const remove = mockApi('delete', '/players/7')

    await archivePlayer(7)
    await restorePlayer(7)
    await deletePlayer(7)

    expect([archive.calls, restore.calls, remove.calls]).toEqual([1, 1, 1])
  })

  it('loads the deletion impact', async () => {
    mockApi('get', '/players/7/deletion-impact', { appearances: 2, events: 3, reports: 1 })

    expect(await getPlayerDeletionImpact(7)).toEqual({ appearances: 2, events: 3, reports: 1 })
  })

  it('rejects with the status when the player cannot be deleted', async () => {
    mockApi('delete', '/players/7', 'Najpierw przenieś zawodnika do archiwum.', 409)

    await expect(deletePlayer(7)).rejects.toMatchObject({ response: { status: 409 } })
  })
})

describe('teamsApi', () => {
  const request = omit(makeTeam(), 'id')

  it('lists teams', async () => {
    mockApi('get', '/teams', [{ ...makeTeam({ id: 1 }), staffMembers: [] }])

    expect((await getTeams())[0].id).toBe(1)
  })

  it('creates, updates and deletes a team', async () => {
    const created = mockApi('post', '/teams', makeTeam({ id: 4 }))
    const updated = mockApi('put', '/teams/4')
    const removed = mockApi('delete', '/teams/4')

    expect((await createTeam(request)).id).toBe(4)
    await updateTeam(4, request)
    await deleteTeam(4)

    expect(created.body).toEqual(request)
    expect(updated.body).toEqual(request)
    expect(removed.calls).toBe(1)
  })
})

describe('matchAppearancesApi', () => {
  const request = { isStarting: true, position: 'CM', matchId: 5, playerId: 3 }

  it('loads the lineup of a match', async () => {
    mockApi('get', '/matchappearances/match/5', [{ id: 1, ...request }])

    expect(await getMatchAppearances(5)).toEqual([{ id: 1, ...request }])
  })

  it('creates, updates and deletes an appearance', async () => {
    const created = mockApi('post', '/matchappearances', { id: 8, ...request })
    const updated = mockApi('put', '/matchappearances/8')
    const removed = mockApi('delete', '/matchappearances/8')

    expect((await createMatchAppearance(request)).id).toBe(8)
    await updateMatchAppearance(8, request)
    await deleteMatchAppearance(8)

    expect(created.body).toEqual(request)
    expect(updated.body).toEqual(request)
    expect(removed.calls).toBe(1)
  })
})

describe('matchEventsApi', () => {
  const request = {
    eventType: 'Goal',
    team: 'Us',
    minute: 30,
    addedTime: null,
    matchId: 5,
    playerId: 3,
    opponentPlayerName: null,
  }

  it('loads the events of a match', async () => {
    mockApi('get', '/matchevents/match/5', [{ id: 1, ...request }])

    expect(await getMatchEvents(5)).toEqual([{ id: 1, ...request }])
  })

  it('creates, updates and deletes an event', async () => {
    const created = mockApi('post', '/matchevents', { id: 8, ...request })
    const updated = mockApi('put', '/matchevents/8')
    const removed = mockApi('delete', '/matchevents/8')

    expect((await createMatchEvent(request)).id).toBe(8)
    await updateMatchEvent(8, request)
    await deleteMatchEvent(8)

    expect(created.body).toEqual(request)
    expect(updated.body).toEqual(request)
    expect(removed.calls).toBe(1)
  })
})

describe('usersApi', () => {
  it('lists users', async () => {
    mockApi('get', '/users', [makeUser({ id: 'a' })])

    expect((await getUsers())[0].id).toBe('a')
  })

  it('updates a user by id', async () => {
    const captured = mockApi('put', '/users/abc-123')
    const request = { role: 'Coach', teamId: 2, fullName: 'Jan Nowak', photoUrl: null }

    await updateUser('abc-123', request)

    expect(captured.body).toEqual(request)
  })

  it('deletes a user by id', async () => {
    const captured = mockApi('delete', '/users/abc-123')

    await deleteUser('abc-123')

    expect(captured.calls).toBe(1)
  })
})

describe('statistics api', () => {
  it('loads player statistics', async () => {
    mockApi('get', '/playerstats', [{ playerId: 1, season: '2025/26' }])

    expect(await getPlayerStats()).toEqual([{ playerId: 1, season: '2025/26' }])
  })

  it('loads team statistics', async () => {
    mockApi('get', '/teamstats', [{ season: '2025/26' }])

    expect(await getTeamStats()).toEqual([{ season: '2025/26' }])
  })
})
