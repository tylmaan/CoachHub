using CoachHub.Api.Data;
using CoachHub.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CoachHub.Api.Services;

public class MatchEventService : IMatchEventService
{
    private readonly ApplicationDbContext _context;
    public MatchEventService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<MatchEvent?> GetByIdAsync(int id)
    {
        return await _context.MatchEvents.FindAsync(id);
    }

    public async Task<List<MatchEvent>> GetByMatchIdAsync(int matchId)
    {
        return await _context.MatchEvents.Where(e => e.MatchId == matchId).ToListAsync();
    }

    public async Task<MatchEvent> CreateAsync(MatchEvent matchEvent)
    {
        _context.MatchEvents.Add(matchEvent);
        await _context.SaveChangesAsync();
        return matchEvent;
    }

    public async Task<bool> UpdateAsync(int id, MatchEvent matchEvent)
    {
        var existing = await _context.MatchEvents.FindAsync(id);
        if (existing is null) return false;

        existing.EventType = matchEvent.EventType;
        existing.Minute = matchEvent.Minute;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await _context.MatchEvents.FindAsync(id);
        if (existing is null) return false;

        _context.MatchEvents.Remove(existing);
        await _context.SaveChangesAsync();
        return true;
    }
}