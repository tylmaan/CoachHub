using CoachHub.Api.Models;
using CoachHub.Api.DTOs;

namespace CoachHub.Api.Services;

public enum DeletePlayerResult
{
    Deleted,
    NotFound,
    NotArchived,
    HasMatchData
}

public interface IPlayerService
{
    Task<List<Player>> GetAllAsync();
    Task<Player?> GetByIdAsync(int id);
    Task<Player> CreateAsync(Player player);
    Task<bool> UpdateAsync(int id, Player player);
    Task<DeletePlayerResult> DeleteAsync(int id);
    Task<bool> ArchiveAsync(int id);
    Task<bool> RestoreAsync(int id);
    Task<PlayerDeletionImpact?> GetDeletionImpactAsync(int id); 
}