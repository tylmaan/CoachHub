namespace CoachHub.Api.DTOs;

public class ReportRequest
{
    public required string Title { get; set; }
    public required string Content { get; set; }
    public int? PlayerId { get; set; }
    public int? TeamId { get; set; }
    public int? MatchId { get; set; }
}