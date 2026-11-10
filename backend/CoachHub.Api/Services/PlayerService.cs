using CoachHub.Api.Data;
using CoachHub.Api.Models;
using CoachHub.Api.DTOs;
using Microsoft.EntityFrameworkCore;

namespace CoachHub.Api.Services;

public class PlayerService : IPlayerService
{
    private readonly ApplicationDbContext _context;
    private readonly IFileStorageService _fileStorageService;

    public PlayerService(ApplicationDbContext context, IFileStorageService fileStorageService)
    {
        _context = context;
        _fileStorageService = fileStorageService;
    }

    public async Task<List<Player>> GetAllAsync()
    {
        return await _context.Players.ToListAsync();
    }

    public async Task<Player?> GetByIdAsync(int id)
    {
        return await _context.Players.FindAsync(id);
    }

    public async Task<Player> CreateAsync(Player player)
    {
        _context.Players.Add(player);
        await _context.SaveChangesAsync();
        return player;
    }

    public async Task<bool> UpdateAsync(int id, Player player)
    {
        var existing = await _context.Players.FindAsync(id);
        if (existing is null) return false;

        var oldPhotoUrl = existing.PhotoUrl;

        existing.FirstName = player.FirstName;
        existing.LastName = player.LastName;
        existing.Nationality = player.Nationality;
        existing.DateOfBirth = player.DateOfBirth;
        existing.Position = player.Position;
        existing.TeamId = player.TeamId;
        existing.HeightCm = player.HeightCm;
        existing.JerseyNumber = player.JerseyNumber;
        existing.PreferredFoot = player.PreferredFoot;
        existing.PhotoUrl = player.PhotoUrl;
        await _context.SaveChangesAsync();

        if (oldPhotoUrl != player.PhotoUrl)
        {
            _fileStorageService.DeleteFile(oldPhotoUrl);
        }

        return true;
    }

    public async Task<DeletePlayerResult> DeleteAsync(int id)
    {
        var existing = await _context.Players.FindAsync(id);
        if (existing is null) return DeletePlayerResult.NotFound;
        if (existing.ArchivedAt is null) return DeletePlayerResult.NotArchived;

        var hasMatchData = await _context.MatchAppearances.AnyAsync(a => a.PlayerId == id) ||
                           await _context.MatchEvents.AnyAsync(e => e.PlayerId == id);
        if (hasMatchData) return DeletePlayerResult.HasMatchData;

        _context.Players.Remove(existing);
        await _context.SaveChangesAsync();
        _fileStorageService.DeleteFile(existing.PhotoUrl);
        return DeletePlayerResult.Deleted;
    }

    public async Task<bool> ArchiveAsync(int id)
    {
        var existing = await _context.Players.FindAsync(id);
        if (existing is null) return false;

        existing.ArchivedAt ??= DateOnly.FromDateTime(DateTime.Today);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RestoreAsync(int id)
    {
        var existing = await _context.Players.FindAsync(id);
        if (existing is null) return false;

        existing.ArchivedAt = null;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<PlayerDeletionImpact?> GetDeletionImpactAsync(int id)
    {
        var exists = await _context.Players.AnyAsync(p => p.Id == id);
        if (!exists) return null;

        return new PlayerDeletionImpact
        {
            Appearances = await _context.MatchAppearances.CountAsync(a => a.PlayerId == id),
            Events = await _context.MatchEvents.CountAsync(e => e.PlayerId == id),
            Reports = await _context.Reports.CountAsync(r => r.PlayerId == id)
        };
    }
}