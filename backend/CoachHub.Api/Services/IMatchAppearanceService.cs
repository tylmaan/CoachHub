using CoachHub.Api.Models;

namespace CoachHub.Api.Services;

public interface IMatchAppearanceService
{
    Task<List<MatchAppearance>> GetAllAsync();
    Task<MatchAppearance?> GetByIdAsync(int id);
    Task<List<MatchAppearance>> GetByMatchIdAsync(int matchId);
    Task<MatchAppearance> CreateAsync(MatchAppearance appearance);
    Task<bool> UpdateAsync(int id, MatchAppearance appearance);
    Task<bool> DeleteAsync(int id);
}