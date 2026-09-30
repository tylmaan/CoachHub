using CoachHub.Api.Models;

namespace CoachHub.Api.Services;

public interface IMatchEventService
{
    Task<MatchEvent?> GetByIdAsync(int id);
    Task<List<MatchEvent>> GetByMatchIdAsync(int matchId);
    Task<MatchEvent> CreateAsync(MatchEvent matchEvent);
    Task<bool> UpdateAsync(int id, MatchEvent matchEvent);
    Task<bool> DeleteAsync(int id);
}