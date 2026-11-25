import {
  createReport,
  deleteReport,
  getReport,
  getReports,
  markReportAsRead,
  updateReport,
} from '@/api/reportsApi'
import type { ReportFilters, ReportRequest } from '@/types/report'
import { makeReport } from '../../utils/factories'
import { mockApi } from '../../utils/mockApi'

const emptyPage = { items: [], hasMore: false, unreadCount: 0, authors: [] }

const filters = (overrides: Partial<ReportFilters> = {}): ReportFilters => ({
  days: 30,
  kinds: [],
  authors: [],
  unreadOnly: false,
  highPriorityOnly: false,
  search: '',
  ...overrides,
})

describe('getReports', () => {
  it('sends scalar filters as query parameters', async () => {
    const captured = mockApi('get', '/reports', emptyPage)

    await getReports(filters({ days: 7, unreadOnly: true, highPriorityOnly: true }))

    const params = captured.url!.searchParams
    expect(params.get('days')).toBe('7')
    expect(params.get('unreadOnly')).toBe('true')
    expect(params.get('highPriorityOnly')).toBe('true')
  })

  it('repeats the key for every kind and author (the format the backend binds)', async () => {
    const captured = mockApi('get', '/reports', emptyPage)

    await getReports(filters({ kinds: ['PlayerMatch', 'TeamGeneral'], authors: ['a', 'b'] }))

    const params = captured.url!.searchParams
    expect(params.getAll('kinds')).toEqual(['PlayerMatch', 'TeamGeneral'])
    expect(params.getAll('authors')).toEqual(['a', 'b'])
    expect(captured.url!.search).not.toContain('[')
  })

  it('sends no kinds or authors when none are selected', async () => {
    const captured = mockApi('get', '/reports', emptyPage)

    await getReports(filters())

    expect(captured.url!.searchParams.has('kinds')).toBe(false)
    expect(captured.url!.searchParams.has('authors')).toBe(false)
  })

  it('trims the search text and omits it when blank', async () => {
    const withText = mockApi('get', '/reports', emptyPage)
    await getReports(filters({ search: '  hamstring  ' }))
    expect(withText.url!.searchParams.get('search')).toBe('hamstring')

    const blank = mockApi('get', '/reports', emptyPage)
    await getReports(filters({ search: '   ' }))
    expect(blank.url!.searchParams.has('search')).toBe(false)
  })

  it('returns the page from the response', async () => {
    mockApi('get', '/reports', { ...emptyPage, items: [makeReport({ id: 4 })], unreadCount: 2, hasMore: true })

    const page = await getReports(filters())

    expect(page.items.map((r) => r.id)).toEqual([4])
    expect(page.unreadCount).toBe(2)
    expect(page.hasMore).toBe(true)
  })
})

describe('single report calls', () => {
  const request: ReportRequest = {
    title: 'Title',
    content: 'Content',
    priority: 'High',
    playerId: 3,
    teamId: null,
    matchId: null,
  }

  it('loads one report', async () => {
    mockApi('get', '/reports/6', makeReport({ id: 6 }))

    expect((await getReport(6)).id).toBe(6)
  })

  it('marks a report as read', async () => {
    const captured = mockApi('post', '/reports/6/read')

    await markReportAsRead(6)

    expect(captured.calls).toBe(1)
  })

  it('creates a report and returns the summary', async () => {
    const captured = mockApi('post', '/reports', makeReport({ id: 12 }))

    expect((await createReport(request)).id).toBe(12)
    expect(captured.body).toEqual(request)
  })

  it('updates and deletes a report', async () => {
    const updated = mockApi('put', '/reports/6')
    const removed = mockApi('delete', '/reports/6')

    await updateReport(6, request)
    await deleteReport(6)

    expect(updated.body).toEqual(request)
    expect(removed.calls).toBe(1)
  })
})
