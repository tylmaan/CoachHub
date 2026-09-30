using CoachHub.Api.Data;
using CoachHub.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CoachHub.Api.Services;

public class MatchService : IMatchService
{
    private readonly ApplicationDbContext _context;

    public MatchService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<Match>> GetAllAsync()
    {
        return await _context.Matches.ToListAsync();
    }

    public async Task<Match?> GetByIdAsync(int id)
    {
        return await _context.Matches.FindAsync(id);
    }

    public async Task<Match> CreateAsync(Match match)
    {
        _context.Matches.Add(match);
        await _context.SaveChangesAsync();
        return match;
    }

    public async Task<bool> UpdateAsync(int id, Match match)
    {
        var existing = await _context.Matches.FindAsync(id);
        if (existing is null) return false;

        existing.Date = match.Date;
        existing.Opponent = match.Opponent;
        existing.Season = match.Season;
        existing.ScoreFor = match.ScoreFor;
        existing.ScoreAgainst = match.ScoreAgainst;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await _context.Matches.FindAsync(id);
        if (existing is null) return false;

        _context.Matches.Remove(existing);
        await _context.SaveChangesAsync();
        return true;
    }
}