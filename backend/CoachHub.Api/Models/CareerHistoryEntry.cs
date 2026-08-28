namespace CoachHub.Api.Models;

public class CareerHistoryEntry
{
    public int Id { get; set; }
    public required string ClubName { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }

    public int PlayerId { get; set; }
    public Player? Player { get; set; }
}