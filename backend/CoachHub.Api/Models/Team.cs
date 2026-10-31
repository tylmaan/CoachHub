namespace CoachHub.Api.Models;

public class Team
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public string? CountryCode { get; set; }
    public string? LogoUrl { get; set; }
    public Kit HomeKit { get; set; } = new() { Pattern = "Solid", PrimaryColor = "#7c3aed", SecondaryColor = "#ffffff" };
    public Kit AwayKit { get; set; } = new() { Pattern = "Solid", PrimaryColor = "#ffffff", SecondaryColor = "#7c3aed" };
    public Kit GoalkeeperKit { get; set; } = new() { Pattern = "Solid", PrimaryColor = "#16a34a", SecondaryColor = "#ffffff" };

    public ICollection<Player> Players { get; set; } = new List<Player>();
    public ICollection<TacticalScheme> TacticalSchemes { get; set; } = new List<TacticalScheme>();
    public ICollection<Report> Reports { get; set; } = new List<Report>();
    public ICollection<ApplicationUser> StaffMembers { get; set; } = new List<ApplicationUser>();
    public ICollection<Match> Matches { get; set; } = new List<Match>();
}