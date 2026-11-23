using CoachHub.Api.Models;
using CoachHub.Api.Data;
using CoachHub.Api.DTOs;
using Microsoft.EntityFrameworkCore;

namespace CoachHub.Api.Services;

public class TacticalSchemeService : ITacticalSchemeService
{
    private readonly ApplicationDbContext _context;

    public TacticalSchemeService(ApplicationDbContext context)
    {
        _context = context;
    }

    private static TacticalSchemeSummary ToSummary(TacticalScheme ts) => new()
    {
        Id = ts.Id,
        Name = ts.Name,
        Data = ts.Data,
        MatchId = ts.MatchId,
        ReportId = ts.ReportId,
        CreatedAt = ts.CreatedAt,
        UpdatedAt = ts.UpdatedAt
    };

    public async Task<List<TacticalSchemeSummary>> GetByMatchIdAsync(int matchId)
    {
        var schemes = await _context.TacticalSchemes
            .AsNoTracking()
            .Where(ts => ts.MatchId == matchId)
            .OrderBy(ts => ts.CreatedAt)
            .ToListAsync();
        return schemes.Select(ToSummary).ToList();
    }

    public async Task<List<TacticalSchemeSummary>> GetByReportIdAsync(int reportId)
    {
        var schemes = await _context.TacticalSchemes
            .AsNoTracking()
            .Where(ts => ts.ReportId == reportId)
            .OrderBy(ts => ts.CreatedAt)
            .ToListAsync();
        return schemes.Select(ToSummary).ToList();
    }    

    public async Task<TacticalSchemeSummary?> GetByIdAsync(int id)
    {
        var scheme = await _context.TacticalSchemes
            .AsNoTracking()
            .FirstOrDefaultAsync(ts => ts.Id == id);
        return scheme is null ? null : ToSummary(scheme);
    }

    public async Task<TacticalSchemeSummary> CreateAsync(TacticalScheme tacticalScheme)
    {
        _context.TacticalSchemes.Add(tacticalScheme);
        await _context.SaveChangesAsync();
        return ToSummary(tacticalScheme);
    }

    public async Task<bool> UpdateAsync(int id, TacticalSchemeRequest request)
    {
        var existing = await _context.TacticalSchemes.FindAsync(id);
        if (existing is null) return false;
        
        existing.Name = request.Name;
        existing.Data = request.Data;
        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await _context.TacticalSchemes.FindAsync(id);
        if (existing is null) return false;

        _context.TacticalSchemes.Remove(existing);
        await _context.SaveChangesAsync();
        return true;
    }
}