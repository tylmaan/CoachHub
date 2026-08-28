namespace CoachHub.Api.Models;

public class Player
{
    public int Id { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public DateOnly DateOfBirth { get; set; }
    public required string Position { get; set; }
    public int TeamId { get; set; }
    public Team? Team { get; set; }

    public ICollection<PlayerSeasonStat> SeasonStats { get; set; } = new List<PlayerSeasonStat>();
    public ICollection<CareerHistoryEntry> CareerHistory { get; set; } = new List<CareerHistoryEntry>();
}