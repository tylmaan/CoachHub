namespace CoachHub.Api.DTOs;

public class TeamMatchResult
{
    public required int MatchId { get; set; }
    public required DateOnly Date { get; set; }
    public required string Opponent { get; set; }
    public string? MatchType { get; set; }
    public bool? IsHome { get; set; }
    public required int ScoreFor { get; set; }
    public required int ScoreAgainst { get; set; }
}