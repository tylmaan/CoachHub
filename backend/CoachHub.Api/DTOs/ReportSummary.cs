namespace CoachHub.Api.DTOs;

public class ReportSummary
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public required string Content { get; set; }
    public DateTime CreatedAt { get; set; }

    public int? PlayerId { get; set; }
    public string? PlayerName { get; set; }
    public int? TeamId { get; set; }

    public int? MatchId { get; set; }
    public string? MatchOpponent { get; set; }
    public DateOnly? MatchDate { get; set; }

    public required string AuthorId { get; set; }
    public required string AuthorName { get; set; }
}