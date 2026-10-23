using CoachHub.Api.Data;
using CoachHub.Api.DTOs;
using Microsoft.EntityFrameworkCore;

namespace CoachHub.Api.Services;

public class PlayerStatsService : IPlayerStatsService
{
    private readonly ApplicationDbContext _context;

    public PlayerStatsService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<PlayerSeasonStats>> GetStatsForTeamAsync(int teamId)
    {
        var players = await _context.Players
            .Where(p => p.TeamId == teamId)
            .ToListAsync();

        var matches = await _context.Matches
            .Where(m => m.TeamId == teamId)
            .Include(m => m.Appearances)
            .Include(m => m.Events)
            .ToListAsync();

        var result = new List<PlayerSeasonStats>();

        foreach (var player in players)
        {
            var seasons = matches
                .Where(m => m.Appearances.Any(a => a.PlayerId == player.Id))
                .Select(m => m.Season)
                .Distinct();
            
            foreach (var season in seasons)
            {
                var seasonMatches = matches
                    .Where(m => m.Season == season)
                    .ToList();
                
                var matchesPlayed = 0;
                var minutesPlayed = 0;

                foreach (var match in seasonMatches)
                {
                    var appearance = match.Appearances
                        .FirstOrDefault(a => a.PlayerId == player.Id);
                    
                    if (appearance is null) continue;

                    int playerMinutes;
                    if (appearance.IsStarting)
                    {
                        var subOff = match.Events
                            .FirstOrDefault(e => e.Team == "Us" && e.PlayerId == player.Id && e.EventType == "SubstitutionOff");
                        playerMinutes = subOff?.Minute ?? 90;
                    }
                    else
                    {
                        var subIn = match.Events
                            .FirstOrDefault(e => e.Team == "Us" && e.PlayerId == player.Id && e.EventType == "SubstitutionIn");
                        playerMinutes = subIn?.Minute is int minuteIn ? 90 - minuteIn : 0;
                    }

                    minutesPlayed += playerMinutes;
                    if (playerMinutes > 0) matchesPlayed++;
                }

                var seasonEvents = seasonMatches
                    .SelectMany(m => m.Events)
                    .Where(e => e.Team == "Us" && e.PlayerId == player.Id)
                    .ToList();

                result.Add(new PlayerSeasonStats
                {
                    PlayerId = player.Id,
                    FirstName = player.FirstName,
                    LastName = player.LastName,
                    PhotoUrl = player.PhotoUrl,
                    Season = season,
                    Matches = matchesPlayed,
                    Minutes = minutesPlayed,
                    Goals = seasonEvents.Count(e => e.EventType is "Goal" or "PenaltyGoal"),
                    Assists = seasonEvents.Count(e => e.EventType == "Assist"),
                    YellowCards = seasonEvents.Count(e => e.EventType == "YellowCard"),
                    RedCards = seasonEvents.Count(e => e.EventType == "RedCard")
                });
            }
        }

        return result
            .OrderByDescending(s => s.Season)
            .ThenBy(s => s.LastName)
            .ToList();

    }
}