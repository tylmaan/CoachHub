namespace CoachHub.Api.Models;

public class ReportRead
{
    public int ReportId { get; set; }
    public required string UserId { get; set; }
    public DateTime ReadAt { get; set; } = DateTime.UtcNow;
}