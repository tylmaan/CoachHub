namespace CoachHub.Api.DTOs;

public class ReportQuery
{
    public int Days { get; set; } = 30;
    public List<string> Kinds { get; set; } = new();
    public List<string> Authors { get; set; } = new();
    public bool UnreadOnly { get; set; }
    public bool HighPriorityOnly { get; set; }
    public string? Search { get; set; }
}