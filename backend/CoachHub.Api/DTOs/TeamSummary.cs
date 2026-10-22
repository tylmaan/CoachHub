namespace CoachHub.Api.DTOs;

public class TeamSummary
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public string? LogoUrl { get; set; }
    public required List<UserSummary> StaffMembers { get; set; }
}