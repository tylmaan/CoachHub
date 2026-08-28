namespace CoachHub.Api.Models;
public class PlayerSeasonStat
{
    public int Id { get; set; }
    public required string Season { get; set; }
    public int Goals { get; set; }
    public int Assists { get; set; }
    public int MatchesPlayed { get; set; }
    public int YellowCards { get; set; }
    public int RedCards { get; set; }

    public int PlayerId { get; set; }
    public Player? Player { get; set; }
}