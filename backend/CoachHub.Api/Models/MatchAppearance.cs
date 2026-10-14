namespace CoachHub.Api.Models;

public class MatchAppearance
{
    public int Id { get; set; }
    public bool IsStarting { get; set; }

    public int MatchId { get; set; }
    public Match? Match { get; set; }

    public int PlayerId { get; set;}
    public Player? Player { get; set; }
}