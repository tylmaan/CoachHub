using CoachHub.Api.Models;

namespace CoachHub.Api.Services;

public interface ITeamService
{
    Task<List<Team>> GetAllAsync();
    Task<Team?> GetByIdAsync(int id);
    Task<Team> CreateAsync(Team team);
    Task<bool> UpdateAsync(int id, Team team);
    Task<bool> DeleteAsync(int id);
}