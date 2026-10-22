using CoachHub.Api.Data;
using CoachHub.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CoachHub.Api.Services;

public class MatchService : IMatchService
{
    private readonly ApplicationDbContext _context;
    private readonly IFileStorageService _fileStorageService;

    public MatchService(ApplicationDbContext context, IFileStorageService fileStorageService)
    {
        _context = context;
        _fileStorageService = fileStorageService;
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

        var oldOpponentLogoUrl = existing.OpponentLogoUrl;

        existing.Date = match.Date;
        existing.Opponent = match.Opponent;
        existing.Season = match.Season;
        existing.ScoreFor = match.ScoreFor;
        existing.ScoreAgainst = match.ScoreAgainst;
        existing.IsHome = match.IsHome;
        existing.MatchType = match.MatchType;
        existing.Competition = match.Competition;
        existing.Round = match.Round;
        existing.Formation = match.Formation;
        existing.OpponentLogoUrl = match.OpponentLogoUrl;
        await _context.SaveChangesAsync();

        if (oldOpponentLogoUrl != match.OpponentLogoUrl)
        {
            _fileStorageService.DeleteFile(oldOpponentLogoUrl);
        }

        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await _context.Matches.FindAsync(id);
        if (existing is null) return false;

        _context.Matches.Remove(existing);
        await _context.SaveChangesAsync();
        _fileStorageService.DeleteFile(existing.OpponentLogoUrl);
        return true;
    }
}