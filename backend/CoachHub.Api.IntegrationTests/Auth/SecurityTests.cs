using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace CoachHub.Api.IntegrationTests.Auth;

public class SecurityTests : ApiTestBase
{
    public SecurityTests(CoachHubFactory factory) : base(factory) { }

    private static string BuildToken(
        string userId,
        string role,
        int teamId,
        string key = CoachHubFactory.JwtKey,
        string issuer = CoachHubFactory.JwtIssuer,
        string audience = CoachHubFactory.JwtAudience,
        DateTime? expires = null)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId),
            new Claim(ClaimTypes.Role, role),
            new Claim("teamId", teamId.ToString())
        };
        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)), SecurityAlgorithms.HmacSha256);

        var notBefore = (expires ?? DateTime.UtcNow.AddMinutes(30)).AddHours(-1);
        var token = new JwtSecurityToken(issuer, audience, claims, notBefore, expires ?? DateTime.UtcNow.AddMinutes(30), credentials);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private async Task<HttpStatusCode> GetPlayersWith(string? token)
    {
        var client = Factory.CreateClient();
        if (token is not null) client.DefaultRequestHeaders.Authorization = new("Bearer", token);
        return (await client.GetAsync("/api/players")).StatusCode;
    }

    [Fact]
    public async Task WellFormedToken_IsAccepted()
    {
        var world = await NewWorldAsync();

        var token = BuildToken(world.Coach.Id, "Coach", world.Team.Id);

        (await GetPlayersWith(token)).Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ExpiredToken_IsRejected()
    {
        var world = await NewWorldAsync();

        var token = BuildToken(world.Coach.Id, "Coach", world.Team.Id, expires: DateTime.UtcNow.AddMinutes(-10));

        (await GetPlayersWith(token)).Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task TokenSignedWithDifferentKey_IsRejected()
    {
        var world = await NewWorldAsync();

        var token = BuildToken(world.Coach.Id, "Coach", world.Team.Id, key: "another-signing-key-that-is-long-enough-123456");

        (await GetPlayersWith(token)).Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task TokenWithWrongIssuer_IsRejected()
    {
        var world = await NewWorldAsync();

        var token = BuildToken(world.Coach.Id, "Coach", world.Team.Id, issuer: "someone-else");

        (await GetPlayersWith(token)).Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task TokenWithWrongAudience_IsRejected()
    {
        var world = await NewWorldAsync();

        var token = BuildToken(world.Coach.Id, "Coach", world.Team.Id, audience: "other-client");

        (await GetPlayersWith(token)).Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task TamperedToken_IsRejected()
    {
        var world = await NewWorldAsync();
        var token = BuildToken(world.Assistant.Id, "AssistantCoach", world.Team.Id);

        var parts = token.Split('.');
        var forgedPayload = Convert.ToBase64String(Encoding.UTF8.GetBytes(
                "{\"sub\":\"" + world.Assistant.Id + "\",\"role\":\"Coach\",\"teamId\":\"" + world.Team.Id + "\"}"))
            .TrimEnd('=').Replace('+', '-').Replace('/', '_');
        var forged = $"{parts[0]}.{forgedPayload}.{parts[2]}";

        (await GetPlayersWith(forged)).Should().Be(HttpStatusCode.Unauthorized);
    }

    [Theory]
    [InlineData("not-a-jwt")]
    [InlineData("")]
    public async Task GarbageToken_IsRejected(string token)
    {
        (await GetPlayersWith(token)).Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task MissingToken_IsRejected()
    {
        (await GetPlayersWith(null)).Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task TokenCannotBeUsedToReachAnotherTeamsData_ByForgingTeamId_WithoutTheKey()
    {
        var world = await NewWorldAsync();
        var forged = BuildToken(world.Coach.Id, "Coach", world.OtherTeam.Id, key: "attacker-key-attacker-key-attacker-key-1");

        var client = Factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new("Bearer", forged);
        var response = await client.GetAsync($"/api/players/{world.OtherPlayer.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Cors_AllowsTheConfiguredFrontendOrigin()
    {
        var request = new HttpRequestMessage(HttpMethod.Options, "/api/players");
        request.Headers.Add("Origin", "http://localhost:5173");
        request.Headers.Add("Access-Control-Request-Method", "GET");

        var response = await Factory.CreateClient().SendAsync(request);

        response.Headers.GetValues("Access-Control-Allow-Origin").Should().Equal("http://localhost:5173");
    }

    [Fact]
    public async Task Cors_DoesNotAllowOtherOrigins()
    {
        var request = new HttpRequestMessage(HttpMethod.Options, "/api/players");
        request.Headers.Add("Origin", "http://evil.example.com");
        request.Headers.Add("Access-Control-Request-Method", "GET");

        var response = await Factory.CreateClient().SendAsync(request);

        response.Headers.Contains("Access-Control-Allow-Origin").Should().BeFalse();
    }
}
