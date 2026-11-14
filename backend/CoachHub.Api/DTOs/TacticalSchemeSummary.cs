namespace CoachHub.Api.DTOs;

public class TacticalSchemeSummary
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string Data { get; set; }
    public int MatchId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}