namespace CoachHub.Api.DTOs;

public class ReportPage
{
    public List<ReportSummary> Items { get; set; } = new();
    public bool HasMore { get; set; }
    public int UnreadCount { get; set; }
}