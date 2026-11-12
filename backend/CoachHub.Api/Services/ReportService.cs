using CoachHub.Api.Models;
using CoachHub.Api.Data;
using CoachHub.Api.DTOs;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace CoachHub.Api.Services;

public class ReportService : IReportService
{
    private readonly ApplicationDbContext _context;

    public ReportService(ApplicationDbContext context)
    {
        _context = context;
    }

    private Expression<Func<Report, ReportSummary>> ToSummary(string userId) => r => new ReportSummary
    {
        Id = r.Id,
        Title = r.Title,
        Content = r.Content,
        Priority = r.Priority,
        CreatedAt = r.CreatedAt,
        IsRead = r.CreatedByUserId == userId || _context.ReportReads.Any(rr => rr.ReportId == r.Id && rr.UserId == userId),
        PlayerId = r.PlayerId,
        PlayerName = r.Player == null ? null : r.Player.FirstName + " " + r.Player.LastName,
        PlayerPhotoUrl = r.Player == null ? null : r.Player.PhotoUrl,
        TeamId = r.TeamId,
        TeamName = r.Team == null ? null : r.Team.Name,
        TeamLogoUrl = r.Team == null ? null : r.Team.LogoUrl,
        MatchId = r.MatchId,
        MatchOpponent = r.Match == null ? null : r.Match.Opponent,
        MatchDate = r.Match == null ? null : r.Match.Date,
        AuthorId = r.CreatedByUserId,
        AuthorName = r.CreatedByUser == null ? r.CreatedByUserId : (r.CreatedByUser.FullName ?? r.CreatedByUser.Email ?? r.CreatedByUserId)
    };

    private IQueryable<Report> Unread(IQueryable<Report> query, string userId) =>
        query.Where(r => r.CreatedByUserId != userId 
            && !_context.ReportReads.Any(rr => rr.ReportId == r.Id && rr.UserId == userId));

    public async Task<Report> CreateReportAsync(Report report)
    {
        _context.Reports.Add(report);
        await _context.SaveChangesAsync();
        return report;
    }

    public async Task<Report?> GetReportByIdAsync(int id)
    {
        return await _context.Reports
            .AsNoTracking()
            .Include(r => r.Player)
            .Include(r => r.Team)
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    public async Task<IEnumerable<Report>> GetReportsByPlayerIdAsync(int playerId)
    {
        return await _context.Reports
            .AsNoTracking()
            .Where(r => r.PlayerId == playerId)
            .Include(r => r.Player)
            .Include(r => r.Team)
            .ToListAsync();
    }

    public async Task<IEnumerable<Report>> GetReportsByTeamIdAsync(int teamId)
    {
        return await _context.Reports
            .AsNoTracking()
            .Where(r => r.TeamId == teamId)
            .Include(r => r.Player)
            .Include(r => r.Team)
            .ToListAsync();
    }

    public async Task<IEnumerable<Report>> GetReportsByUserIdAsync(string userId)
    {
        return await _context.Reports
            .AsNoTracking()
            .Where(r => r.CreatedByUserId == userId)
            .Include(r => r.Player)
            .Include(r => r.Team)
            .ToListAsync();
    }

    public async Task<ReportSummary?> GetSummaryByIdAsync(int id, string userId)
    {
        return await _context.Reports
            .AsNoTracking()
            .Where(r => r.Id == id)
            .Select(ToSummary(userId))
            .FirstOrDefaultAsync();
    }

    public async Task<ReportPage> GetPageAsync(int teamId, string userId, ReportQuery query)
    {
        var all = _context.Reports
            .AsNoTracking()
            .Where(r => r.TeamId == teamId || (r.Player != null && r.Player.TeamId == teamId));
        
        var unreadCount = await Unread(all, userId).CountAsync();

        var filtered = all;

        if (query.Kinds.Count > 0)
        {
            var playerMatch = query.Kinds.Contains("PlayerMatch");
            var playerGeneral = query.Kinds.Contains("PlayerGeneral");
            var teamMatch = query.Kinds.Contains("TeamMatch");
            var teamGeneral = query.Kinds.Contains("TeamGeneral");

            filtered = filtered.Where(r =>
                (playerMatch && r.PlayerId != null && r.MatchId != null) ||
                (playerGeneral && r.PlayerId != null && r.MatchId == null) ||
                (teamMatch && r.TeamId != null && r.MatchId != null) ||
                (teamGeneral && r.TeamId != null && r.MatchId == null));
        }
        if (query.Authors.Count > 0)
            filtered = filtered.Where(r => query.Authors.Contains(r.CreatedByUserId));
        if (query.HighPriorityOnly)
            filtered = filtered.Where(r => r.Priority == "High");
        if (query.UnreadOnly)
            filtered = Unread(filtered, userId);

        var ordered = filtered.OrderByDescending(r => r.CreatedAt);

        var search = query.Search?.Trim();
        if (!string.IsNullOrEmpty(search))
        {
            var summaries = await ordered.Select(ToSummary(userId)).ToListAsync();
            var found = summaries
                .Where(s => $"{s.Title} {s.Content} {s.PlayerName} {s.MatchOpponent}"
                    .Contains(search, StringComparison.OrdinalIgnoreCase))
                .ToList();

            return new ReportPage
            {
                Items = found,
                HasMore = false,
                UnreadCount = unreadCount
            };
        }

        var cutOff = DateTime.UtcNow.AddDays(-Math.Clamp(query.Days, 1, 3650));
        return new ReportPage
        {
            Items = await ordered
                .Where(r => r.CreatedAt >= cutOff)
                .Select(ToSummary(userId))
                .ToListAsync(),
            HasMore = await filtered
                .AnyAsync(r => r.CreatedAt < cutOff),
            UnreadCount = unreadCount
        };
    }

    public async Task MarkAsReadAsync(int reportId, string userId)
    {
        var alreadyRead = await _context.ReportReads
            .AnyAsync(rr => rr.ReportId == reportId && rr.UserId == userId);
        if (alreadyRead) return;

        _context.ReportReads.Add(new ReportRead
        {
            ReportId = reportId,
            UserId = userId
        });
        await _context.SaveChangesAsync();
    }

    public async Task<bool> UpdateReportAsync(int id, Report report)
    {
        var existing = await _context.Reports.FindAsync(id);
        if (existing == null) return false;

        existing.Title = report.Title;
        existing.Content = report.Content;
        existing.Priority = report.Priority;
        existing.PlayerId = report.PlayerId;
        existing.TeamId = report.TeamId;
        existing.MatchId = report.MatchId;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteReportAsync(int id)
    {
        var report = await _context.Reports.FindAsync(id);
        if (report is null) return false;

        _context.Reports.Remove(report);
        await _context.SaveChangesAsync();
        return true;
    }
}