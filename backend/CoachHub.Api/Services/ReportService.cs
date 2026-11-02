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

    private static readonly Expression<Func<Report, ReportSummary>> ToSummary = r => new ReportSummary
    {
        Id = r.Id,
        Title = r.Title,
        Content = r.Content,
        CreatedAt = r.CreatedAt,
        PlayerId = r.PlayerId,
        PlayerName = r.Player == null ? null : r.Player.FirstName + " " + r.Player.LastName,
        TeamId = r.TeamId,
        MatchId = r.MatchId,
        MatchOpponent = r.Match == null ? null : r.Match.Opponent,
        MatchDate = r.Match == null ? null : r.Match.Date,
        AuthorId = r.CreatedByUserId,
        AuthorName = r.CreatedByUser == null ? r.CreatedByUserId : (r.CreatedByUser.FullName ?? r.CreatedByUser.Email ?? r.CreatedByUserId)
    };

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

    public async Task<List<ReportSummary>> GetSummariesForTeamAsync(int teamId)
    {
        return await _context.Reports
            .AsNoTracking()
            .Where(r => r.TeamId == teamId || (r.Player != null && r.Player.TeamId == teamId))
            .OrderByDescending(r => r.CreatedAt)
            .Select(ToSummary)
            .ToListAsync();
    }

    public async Task<ReportSummary?> GetSummaryByIdAsync(int id)
    {
        return await _context.Reports
            .AsNoTracking()
            .Where(r => r.Id == id)
            .Select(ToSummary)
            .FirstOrDefaultAsync();
    }

    public async Task<bool> UpdateReportAsync(int id, Report report)
    {
        var existing = await _context.Reports.FindAsync(id);
        if (existing == null) return false;

        existing.Title = report.Title;
        existing.Content = report.Content;
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