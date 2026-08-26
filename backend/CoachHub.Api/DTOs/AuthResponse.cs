namespace CoachHub.Api.DTOs;

public class AuthResponse
{
    public required string Token { get; set; }
    public required string Email { get; set; }
    public required List<string> Roles { get; set; } 
}