using CoachHub.Api.Data;
using CoachHub.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CoachHub.Api.Services;

public class PlayerService : IPlayerService
{
    private readonly ApplicationDbContext _context;    

    public PlayerService(ApplicationDbContext context)
    {
        _context = context;
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

        existing.FirstName = player.FirstName;
        existing.LastName = player.LastName;
        existing.DateOfBirth = player.DateOfBirth;
        existing.Position = player.Position;
        existing.TeamId = player.TeamId;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await _context.Players.FindAsync(id);
        if (existing is null) return false;

        _context.Players.Remove(existing);
        await _context.SaveChangesAsync();
        return true;
    }
}