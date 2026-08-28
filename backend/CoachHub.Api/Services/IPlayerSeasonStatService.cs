using CoachHub.Api.Models;

namespace CoachHub.Api.Services;

public interface IPlayerSeasonStatService
{
    Task<List<PlayerSeasonStat>> GetAllAsync();
    Task<PlayerSeasonStat?> GetByIdAsync(int Id);
    Task<PlayerSeasonStat> CreateAsync(PlayerSeasonStat playerSeasonStat);
    Task<bool> UpdateAsync(int Id, PlayerSeasonStat playerSeasonStat);
    Task<bool> DeleteAsync(int Id);
}