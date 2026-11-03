namespace CoachHub.Api.DTOs;

public class TeamSeasonStats
{
    public required string Season { get; set; }
    public required List<TeamMatchResult> Results { get; set; }
    public required int[] GoalsScoredByPeriod { get; set; }
    public required int[] GoalsConcededByPeriod { get; set; }
    public required int YellowCards { get; set; }
    public required int RedCards { get; set; }
}