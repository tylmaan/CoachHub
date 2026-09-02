using CoachHub.Api.Models;

namespace CoachHub.Api.Services;

public interface ITacticalSchemeService
{
    Task<TacticalScheme> CreateTacticalSchemeAsync (TacticalScheme tacticalScheme);
    Task<TacticalScheme?> GetTacticalSchemeByIdAsync(int id);
    Task<IEnumerable<TacticalScheme>> GetTacticalSchemesByTeamIdAsync(int teamId);
    Task<bool> UpdateTacticalSchemeAsync(int id, TacticalScheme tacticalScheme);
    Task<bool> DeleteTacticalSchemeAsync(int id);
}