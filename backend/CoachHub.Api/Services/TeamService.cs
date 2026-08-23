using CoachHub.Api.Data;
using CoachHub.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CoachHub.Api.Services;

public class TeamService : ITeamService
{
    private readonly ApplicationDbContext _context;

    public TeamService(ApplicationDbContext context)
    {
        _context = context;
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

        existing.Name = team.Name;
        existing.FoundedDate = team.FoundedDate;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await _context.Teams.FindAsync(id);
        if (existing is null) return false;

        _context.Teams.Remove(existing);
        await _context.SaveChangesAsync();
        return true;
    }
}
    