namespace CoachHub.Api.DTOs;

public class UserSummary
{
    public required string Id { get; set; }
    public required string Email { get; set; }
    public required List<string> Roles { get; set; }
    public int? TeamId { get; set; }
}