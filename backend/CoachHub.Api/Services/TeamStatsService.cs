using CoachHub.Api.Data;
using CoachHub.Api.DTOs;
using CoachHub.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CoachHub.Api.Services;

public class TeamStatsService : ITeamStatsService
{
    private const int PeriodCount = 7;
    private const int PeriodLength = 15;
    private const int ExtraTimePeriod = 6;

    private readonly ApplicationDbContext _context;

    public TeamStatsService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<TeamSeasonStats>> GetStatsForTeamAsync(int teamId)
    {
        var matches = await _context.Matches
            .Where(m => m.TeamId == teamId && m.ScoreFor != null && m.ScoreAgainst != null && m.Status == "Played")
            .Include(m => m.Events)
            .ToListAsync();

        return matches
            .GroupBy(m => m.Season)
            .OrderByDescending(g => g.Key)
            .Select(BuildSeasonStats)
            .ToList();
    }

    private static TeamSeasonStats BuildSeasonStats(IGrouping<string, Match> season)
    {
        var scored = new int[PeriodCount];
        var conceded = new int[PeriodCount];
        var yellowCards = 0;
        var redCards = 0;

        foreach (var e in season.SelectMany(m => m.Events))
        {
            var isOurs = e.Team == "Us";
            if (isOurs && e.EventType == "YellowCard") yellowCards++;
            if (isOurs && e.EventType == "RedCard") redCards++;

            var isGoal = e.EventType is "Goal" or "PenaltyGoal";
            var isOwnGoal = e.EventType == "OwnGoal";
            var scoredForUs = (isGoal && isOurs) || (isOwnGoal && !isOurs);
            var scoredAgainstUs = (isGoal && !isOurs) || (isOwnGoal && isOurs);

            if (e.Minute is not int minute) continue;
            if (scoredForUs) scored[PeriodOf(minute)]++;
            if (scoredAgainstUs) conceded[PeriodOf(minute)]++;
        }

        return new TeamSeasonStats
        {
            Season = season.Key,
            Results = season
                .OrderBy(m => m.Date)
                .ThenBy(m => m.Id)
                .Select(m => new TeamMatchResult
                {
                    MatchId = m.Id,
                    Date = m.Date,
                    Opponent = m.Opponent,
                    MatchType = m.MatchType,
                    IsHome = m.IsHome,
                    ScoreFor = m.ScoreFor!.Value,
                    ScoreAgainst = m.ScoreAgainst!.Value
                })
                .ToList(),
            GoalsScoredByPeriod = scored,
            GoalsConcededByPeriod = conceded,
            YellowCards = yellowCards,
            RedCards = redCards
        };
    }

    private static int PeriodOf(int minute) =>
        minute > 90 ? ExtraTimePeriod : Math.Max(minute - 1, 0) / PeriodLength;
}