using CoachHub.Api.Data;
using CoachHub.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CoachHub.Api.Services;

public class TeamService : ITeamService
{
    private readonly ApplicationDbContext _context;
    private readonly IFileStorageService _fileStorageService;

    public TeamService(ApplicationDbContext context, IFileStorageService fileStorageService)
    {
        _context = context;
        _fileStorageService = fileStorageService;
    }

    public async Task<List<Team>> GetAllAsync()
    {
        return await _context.Teams.ToListAsync();
    }

    public async Task<Team?> GetByIdAsync(int id)
    {
        return await _context.Teams.FindAsync(id);
    }

    public async Task<Team> CreateAsync(Team team)
    {
        _context.Teams.Add(team);
        await _context.SaveChangesAsync();
        return team;
    }

    public async Task<bool> UpdateAsync(int id, Team team)
    {
        var existing = await _context.Teams.FindAsync(id);
        if (existing is null) return false;

        var oldLogoUrl = existing.LogoUrl;

        existing.Name = team.Name;
        existing.LogoUrl = team.LogoUrl;
        existing.HomeKit = team.HomeKit;
        existing.AwayKit = team.AwayKit;
        existing.GoalkeeperKit = team.GoalkeeperKit;
        await _context.SaveChangesAsync();

        if (oldLogoUrl != team.LogoUrl)
        {
            _fileStorageService.DeleteFile(oldLogoUrl);
        }

        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await _context.Teams.FindAsync(id);
        if (existing is null) return false;

        _context.Teams.Remove(existing);
        await _context.SaveChangesAsync();
        _fileStorageService.DeleteFile(existing.LogoUrl);
        return true;
    }
}
    