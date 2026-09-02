using CoachHub.Api.Models;
using CoachHub.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace CoachHub.Api.Services;

public class TacticalSchemeService : ITacticalSchemeService
{
    private readonly ApplicationDbContext _context;

    public TacticalSchemeService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<TacticalScheme> CreateTacticalSchemeAsync(TacticalScheme tacticalScheme)
    {
        _context.TacticalSchemes.Add(tacticalScheme);
        await _context.SaveChangesAsync();
        return tacticalScheme;
    }

    public async Task<TacticalScheme?> GetTacticalSchemeByIdAsync(int id)
    {
        return await _context.TacticalSchemes
            .AsNoTracking()
            .Include(ts => ts.Team)
            .FirstOrDefaultAsync(ts => ts.Id == id);
    }

    public async Task<IEnumerable<TacticalScheme>> GetTacticalSchemesByTeamIdAsync(int teamId)
    {
        return await _context.TacticalSchemes
            .AsNoTracking()
            .Where(ts => ts.TeamId == teamId)
            .Include(ts => ts.Team)
            .ToListAsync();
    }

    public async Task<bool> UpdateTacticalSchemeAsync(int id, TacticalScheme tacticalScheme)
    {
        var existing = await _context.TacticalSchemes.FindAsync(id);
        if (existing is null) return false;
        
        existing.Name = tacticalScheme.Name;
        existing.CanvasData = tacticalScheme.CanvasData;
        
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteTacticalSchemeAsync(int id)
    {
        var existing = await _context.TacticalSchemes.FindAsync(id);
        if (existing is null) return false;

        _context.TacticalSchemes.Remove(existing);
        await _context.SaveChangesAsync();
        return true;
    }
}