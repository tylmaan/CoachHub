using CoachHub.Api.Models;

namespace CoachHub.Api.DTOs;

public class TeamSummary
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public string? CountryCode { get; set; }
    public string? LogoUrl { get; set; }
    public required Kit HomeKit { get; set; }
    public required Kit AwayKit { get; set; }
    public required Kit GoalkeeperKit { get; set; }
    public required List<UserSummary> StaffMembers { get; set; }
}