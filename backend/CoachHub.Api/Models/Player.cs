namespace CoachHub.Api.Models;

public class Player
{
    public int Id { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public DateOnly DateOfBirth { get; set; }
    public required string Position { get; set; }
    public int? HeightCm { get; set; }
    public int? WeightKg { get; set; }
    public int? JerseyNumber { get; set; }
    public string? PreferredFoot { get; set; } 
    public int TeamId { get; set; }
    public Team? Team { get; set; }
    public string? PhotoUrl { get; set; } 

    public ICollection<CareerHistoryEntry> CareerHistory { get; set; } = new List<CareerHistoryEntry>();
    public ICollection<MatchAppearance> MatchAppearances { get; set; } = new List<MatchAppearance>();
    public ICollection<MatchEvent> MatchEvents { get; set; } = new List<MatchEvent>();
    public ICollection<Report> Reports { get; set; } = new List<Report>();
}