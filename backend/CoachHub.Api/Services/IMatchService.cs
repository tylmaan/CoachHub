using CoachHub.Api.Models;

namespace CoachHub.Api.Services;

public interface IMatchService
{
    Task<List<Match>> GetAllAsync();
    Task<Match?> GetByIdAsync(int id);
    Task<Match> CreateAsync(Match match);
    Task<bool> UpdateAsync(int id, Match match);
    Task<bool> DeleteAsync(int id);
}