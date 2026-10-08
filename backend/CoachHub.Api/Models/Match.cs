namespace CoachHub.Api.Models;

public class Match
{
    public int Id { get; set; }
    public DateOnly Date { get; set; }
    public required string Opponent { get; set; }
    public required string Season { get; set; }
    public int? ScoreFor { get; set; }
    public int? ScoreAgainst { get; set; }
    public bool? IsHome { get; set; }
    public string? MatchType { get; set; }
    public int? Round { get; set; }
    public string? OpponentLogoUrl { get; set; }

    public int TeamId { get; set; }
    public Team? Team { get; set; }

    public ICollection<MatchAppearance> Appearances { get; set; } = new List<MatchAppearance>();
    public ICollection<MatchEvent> Events { get; set; } = new List<MatchEvent>();
}