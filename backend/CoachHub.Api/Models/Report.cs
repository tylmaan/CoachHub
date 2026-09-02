namespace CoachHub.Api.Models;

public class Report
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public required string Content { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int? PlayerId { get; set; }
    public Player? Player { get; set; }

    public int? TeamId { get; set; }
    public Team? Team { get; set; }

    public required string CreatedByUserId { get; set; }
    public ApplicationUser? CreatedByUser { get; set; }
}