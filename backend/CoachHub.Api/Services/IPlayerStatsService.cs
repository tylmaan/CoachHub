using CoachHub.Api.DTOs;

namespace CoachHub.Api.Services;

public interface IPlayerStatsService
{
    Task<List<PlayerSeasonStats>> GetStatsForTeamAsync(int teamId);
}