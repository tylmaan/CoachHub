namespace CoachHub.Api.Models;

public class TacticalScheme
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string CanvasData { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int TeamId { get; set; }
    public Team? Team { get; set; }

    public required string CreatedByUserId { get; set; }
    public ApplicationUser? CreatedByUser { get; set; }
}