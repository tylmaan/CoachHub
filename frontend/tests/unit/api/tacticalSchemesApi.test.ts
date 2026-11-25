import {
  createMatchTacticalScheme,
  createReportTacticalScheme,
  createSchemeForOwner,
  deleteTacticalScheme,
  getMatchTacticalSchemes,
  getReportTacticalSchemes,
  getSchemesByOwner,
  updateTacticalScheme,
} from '@/api/tacticalSchemesApi'
import { makeScheme } from '../../utils/factories'
import { mockApi } from '../../utils/mockApi'

const request = { name: 'Corner', data: '{"version":1,"objects":[]}' }

describe('tacticalSchemesApi', () => {
  it('loads the schemes of a match and of a report', async () => {
    mockApi('get', '/tacticalschemes/match/5', [makeScheme({ id: 1 })])
    mockApi('get', '/tacticalschemes/report/8', [makeScheme({ id: 2 })])

    expect((await getMatchTacticalSchemes(5))[0].id).toBe(1)
    expect((await getReportTacticalSchemes(8))[0].id).toBe(2)
  })

  it('chooses the match or report endpoint by owner kind when loading', async () => {
    const match = mockApi('get', '/tacticalschemes/match/5', [])
    const report = mockApi('get', '/tacticalschemes/report/5', [])

    await getSchemesByOwner('match', 5)
    expect([match.calls, report.calls]).toEqual([1, 0])

    await getSchemesByOwner('report', 5)
    expect([match.calls, report.calls]).toEqual([1, 1])
  })

  it('creates a scheme for a match or a report', async () => {
    const forMatch = mockApi('post', '/tacticalschemes/match/5', makeScheme({ id: 10 }))
    const forReport = mockApi('post', '/tacticalschemes/report/8', makeScheme({ id: 11 }))

    expect((await createMatchTacticalScheme(5, request)).id).toBe(10)
    expect((await createReportTacticalScheme(8, request)).id).toBe(11)

    expect(forMatch.body).toEqual(request)
    expect(forReport.body).toEqual(request)
  })

  it('chooses the match or report endpoint by owner kind when creating', async () => {
    const match = mockApi('post', '/tacticalschemes/match/5', makeScheme())
    const report = mockApi('post', '/tacticalschemes/report/5', makeScheme())

    await createSchemeForOwner('report', 5, request)
    expect([match.calls, report.calls]).toEqual([0, 1])

    await createSchemeForOwner('match', 5, request)
    expect([match.calls, report.calls]).toEqual([1, 1])
  })

  it('updates and deletes a scheme', async () => {
    const updated = mockApi('put', '/tacticalschemes/10')
    const removed = mockApi('delete', '/tacticalschemes/10')

    await updateTacticalScheme(10, request)
    await deleteTacticalScheme(10)

    expect(updated.body).toEqual(request)
    expect(removed.calls).toBe(1)
  })
})
