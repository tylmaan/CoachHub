namespace CoachHub.Api.Models;

public class TacticalScheme
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string Data { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public int MatchId { get; set; }
    public Match? Match { get; set; }

    public required string CreatedByUserId { get; set; }
    public ApplicationUser? CreatedByUser { get; set; }
}