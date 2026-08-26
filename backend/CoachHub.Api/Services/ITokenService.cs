using CoachHub.Api.Models;

namespace CoachHub.Api.Services;

public interface ITokenService
{
    Task<string> GenerateTokenAsync(ApplicationUser user);
}