using CoachHub.Api.Data;
using CoachHub.Api.Migrations;
using CoachHub.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CoachHub.Api.Services;

public class MatchAppearanceService : IMatchAppearanceService
{
    private readonly ApplicationDbContext _context;

    public MatchAppearanceService (ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<MatchAppearance>> GetAllAsync()
    {
        return await _context.MatchAppearances.ToListAsync();
    }

    public async Task<MatchAppearance?> GetByIdAsync(int id)
    {
        return await _context.MatchAppearances.FindAsync(id);
    }

    public async Task<List<MatchAppearance>> GetByMatchIdAsync(int matchId)
    {
        return await _context.MatchAppearances.Where(a => a.MatchId == matchId).ToListAsync();
    }

    public async Task<MatchAppearance> CreateAsync(MatchAppearance appearance)
    {
        _context.MatchAppearances.Add(appearance);
        await _context.SaveChangesAsync();
        return appearance;
    }

    public async Task<bool> UpdateAsync(int id, MatchAppearance appearance)
    {
        var existing = await _context.MatchAppearances.FindAsync(id);
        if (existing is null) return false;

        existing.MinutesPlayed = appearance.MinutesPlayed;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await _context.MatchAppearances.FindAsync(id);
        if (existing is null) return false;

        _context.MatchAppearances.Remove(existing);
        await _context.SaveChangesAsync();
        return true;
    }
}