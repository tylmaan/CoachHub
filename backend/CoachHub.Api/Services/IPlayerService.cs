using CoachHub.Api.Models;

namespace CoachHub.Api.Services;

public interface IPlayerService
{
    Task<List<Player>> GetAllAsync();
    Task<Player?> GetByIdAsync(int id);
    Task<Player> CreateAsync(Player player);
    Task<bool> UpdateAsync(int id, Player player);
    Task<bool> DeleteAsync(int id);
}