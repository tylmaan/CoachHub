import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReportAvatar } from '@/components/reports/ReportAvatar'
import { ReportTile } from '@/components/reports/ReportTile'
import { makeReport } from '../../utils/factories'

describe('ReportAvatar', () => {
  it('shows the player photo from the backend', () => {
    const { container } = render(
      <ReportAvatar report={{ playerName: 'Jan Kowalski', playerPhotoUrl: '/uploads/p.png', teamLogoUrl: null }} />,
    )

    expect(container.querySelector('img')).toHaveAttribute('src', 'http://localhost:5006/uploads/p.png')
  })

  it.each([
    ['Jan Kowalski', 'JK'],
    ['jan maria kowalski', 'JK'],
    ['  Anna   Nowak ', 'AN'],
  ])('shows the initials of %s when there is no photo', (playerName, initials) => {
    render(<ReportAvatar report={{ playerName, playerPhotoUrl: null, teamLogoUrl: null }} />)

    expect(screen.getByText(initials)).toBeInTheDocument()
  })

  it('shows the team logo for team reports', () => {
    const { container } = render(
      <ReportAvatar report={{ playerName: null, playerPhotoUrl: null, teamLogoUrl: '/uploads/t.png' }} />,
    )

    expect(container.querySelector('img')).toHaveAttribute('src', 'http://localhost:5006/uploads/t.png')
  })

  it('falls back to a shield icon for a team without a logo', () => {
    render(<ReportAvatar report={{ playerName: null, playerPhotoUrl: null, teamLogoUrl: null }} />)

    expect(screen.getByTestId('ShieldOutlinedIcon')).toBeInTheDocument()
  })

  it('prefers the player over the team when both are present', () => {
    render(<ReportAvatar report={{ playerName: 'Jan Kowalski', playerPhotoUrl: null, teamLogoUrl: '/uploads/t.png' }} />)

    expect(screen.getByText('JK')).toBeInTheDocument()
    expect(screen.queryByTestId('ShieldOutlinedIcon')).not.toBeInTheDocument()
  })

  it('uses the given size', () => {
    const { container } = render(
      <ReportAvatar size={80} report={{ playerName: 'Jan Kowalski', playerPhotoUrl: null, teamLogoUrl: null }} />,
    )

    expect(container.firstElementChild).toHaveStyle({ width: '80px', height: '80px' })
  })
})

describe('ReportTile', () => {
  const dateOf = (iso: string) => new Date(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })

  it('shows the subject, the title, the author and the date', () => {
    render(
      <ReportTile
        report={makeReport({
          playerName: 'Jan Kowalski',
          playerId: 3,
          matchId: 5,
          matchOpponent: 'Rival FC',
          title: 'Strong first half',
          authorName: 'Anna Kowalska',
          createdAt: '2025-10-05T12:00:00Z',
        })}
        onOpen={vi.fn()}
      />,
    )

    expect(screen.getByText('Jan Kowalski vs Rival FC')).toBeInTheDocument()
    expect(screen.getByText('Strong first half')).toBeInTheDocument()
    expect(screen.getByText(`Anna Kowalska · ${dateOf('2025-10-05T12:00:00Z')}`)).toBeInTheDocument()
  })

  it('describes a general team report by its team', () => {
    render(<ReportTile report={makeReport({ teamName: 'FC Test', matchOpponent: null })} onOpen={vi.fn()} />)

    expect(screen.getByText('FC Test - raport')).toBeInTheDocument()
  })

  it('opens the report when clicked', async () => {
    const onOpen = vi.fn()
    render(<ReportTile report={makeReport({ id: 42 })} onOpen={onOpen} />)

    await userEvent.setup().click(screen.getByRole('button'))

    expect(onOpen).toHaveBeenCalledWith(42)
  })

  it('marks high priority reports', () => {
    render(<ReportTile report={makeReport({ priority: 'High' })} onOpen={vi.fn()} />)

    expect(screen.getByText('Wysoki')).toBeInTheDocument()
  })

  it('marks low priority reports', () => {
    render(<ReportTile report={makeReport({ priority: 'Low' })} onOpen={vi.fn()} />)

    expect(screen.getByText('Niski')).toBeInTheDocument()
  })

  it('shows no priority chip for normal reports', () => {
    render(<ReportTile report={makeReport({ priority: 'Normal' })} onOpen={vi.fn()} />)

    expect(screen.queryByText('Wysoki')).not.toBeInTheDocument()
    expect(screen.queryByText('Niski')).not.toBeInTheDocument()
  })

  it('shows unread reports in bold and read reports in regular weight', () => {
    const { rerender } = render(<ReportTile report={makeReport({ isRead: false, teamName: 'FC Test' })} onOpen={vi.fn()} />)
    expect(screen.getByText('FC Test - raport')).toHaveStyle({ fontWeight: '600' })

    rerender(<ReportTile report={makeReport({ isRead: true, teamName: 'FC Test' })} onOpen={vi.fn()} />)
    expect(screen.getByText('FC Test - raport')).toHaveStyle({ fontWeight: '400' })
  })
})
