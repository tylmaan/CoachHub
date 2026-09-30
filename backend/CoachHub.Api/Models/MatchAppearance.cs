namespace CoachHub.Api.Models;

public class MatchAppearance
{
    public int Id { get; set; }
    public int? MinutesPlayed { get; set; }

    public int MatchId { get; set; }
    public Match? Match { get; set; }

    public int PlayerId { get; set;}
    public Player? Player { get; set; }
}