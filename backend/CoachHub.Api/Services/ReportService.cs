using CoachHub.Api.Models;
using CoachHub.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace CoachHub.Api.Services;

public class ReportService : IReportService
{
    private readonly ApplicationDbContext _context;

    public ReportService(ApplicationDbContext context)
    {
        _context = context;
    }

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

    public async Task<bool> UpdateReportAsync(int id, Report report)
    {
        var existing = await _context.Reports.FindAsync(id);
        if (existing == null) return false;

        existing.Title = report.Title;
        existing.Content = report.Content;
        existing.PlayerId = report.PlayerId;
        existing.TeamId = report.TeamId;
        existing.CreatedByUserId = report.CreatedByUserId;

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