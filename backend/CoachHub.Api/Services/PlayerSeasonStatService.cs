using CoachHub.Api.Models;
using CoachHub.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace CoachHub.Api.Services;

public class PlayerSeasonStatService : IPlayerSeasonStatService
{
    private readonly ApplicationDbContext _context;

    public PlayerSeasonStatService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<PlayerSeasonStat>> GetAllAsync()
    {
        return await _context.PlayerSeasonStats.ToListAsync();
    }

    public async Task<PlayerSeasonStat?> GetByIdAsync(int Id)
    {
        return await _context.PlayerSeasonStats.FindAsync(Id);
    }

    public async Task<PlayerSeasonStat> CreateAsync(PlayerSeasonStat playerSeasonStat)
    {
        _context.PlayerSeasonStats.Add(playerSeasonStat);
        await _context.SaveChangesAsync();
        return playerSeasonStat;
    }

    public async Task<bool> UpdateAsync(int Id, PlayerSeasonStat playerSeasonStat)
    {
        var existing = await _context.PlayerSeasonStats.FindAsync(Id);
        if (existing is null) return false;

        existing.Goals = playerSeasonStat.Goals;
        existing.Assists = playerSeasonStat.Assists;
        existing.MatchesPlayed = playerSeasonStat.MatchesPlayed;
        existing.YellowCards = playerSeasonStat.YellowCards;
        existing.RedCards = playerSeasonStat.RedCards;
        existing.Season = playerSeasonStat.Season;
        existing.PlayerId = playerSeasonStat.PlayerId;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int Id)
    {
        var existing = await _context.PlayerSeasonStats.FindAsync(Id);
        if (existing is null) return false;

        _context.PlayerSeasonStats.Remove(existing);
        await _context.SaveChangesAsync();
        return true;
    }
}