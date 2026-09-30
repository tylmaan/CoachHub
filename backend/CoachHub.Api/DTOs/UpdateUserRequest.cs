namespace CoachHub.Api.DTOs;

public class UpdateUserRequest
{
    public required string Role { get; set; }
    public required int TeamId { get; set; }
    public string? FullName { get; set; }
    public string? PhotoUrl { get; set; }
}