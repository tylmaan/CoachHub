namespace CoachHub.Api.DTOs;

public class PlayerSeasonStats
{
    public required int PlayerId { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public required string Season { get; set; }
    public required int Matches { get; set; }
    public required int Minutes { get; set; }
    public required int Goals { get; set; }
    public required int Assists { get; set; }
    public required int YellowCards { get; set; }
    public required int RedCards { get; set; }
}