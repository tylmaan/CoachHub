namespace CoachHub.Api.Models;

public class Team
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public DateOnly FoundedDate { get; set; }
}