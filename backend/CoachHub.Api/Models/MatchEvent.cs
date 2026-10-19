namespace CoachHub.Api.Models;

public class MatchEvent
{
    public int Id { get; set; }
    public required string EventType { get; set; }
    public required string Team { get; set; }
    public int? Minute { get; set; }
    public int? AddedTime { get; set; }

    public int MatchId { get; set; }
    public Match? Match { get; set; }

    public int? PlayerId { get; set; }
    public Player? Player { get; set; }
    public string? OpponentPlayerName { get; set; }
}