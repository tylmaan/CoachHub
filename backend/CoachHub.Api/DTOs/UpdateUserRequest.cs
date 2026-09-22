namespace CoachHub.Api.DTOs;

public class UpdateUserRequest
{
    public required string Role { get; set; }
    public required int TeamId { get; set; }
}