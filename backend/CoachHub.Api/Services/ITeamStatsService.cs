using CoachHub.Api.DTOs;

namespace CoachHub.Api.Services;

public interface ITeamStatsService
{
    Task<List<TeamSeasonStats>> GetStatsForTeamAsync(int teamId);
}