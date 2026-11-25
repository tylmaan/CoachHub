using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CoachHub.Api.Data;
using CoachHub.Api.Models;
using CoachHub.Api.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace CoachHub.Api.UnitTests.Services;

public class TokenServiceTests : IDisposable
{
    private const string Key = "unit-test-signing-key-which-is-long-enough-for-hs256";
    private const string Issuer = "coachhub-tests";
    private const string Audience = "coachhub-tests-clients";

    private readonly IdentityHost _identity = new();

    public void Dispose() => _identity.Dispose();

    private TokenService CreateSut(Dictionary<string, string?>? overrides = null)
    {
        var settings = new Dictionary<string, string?>
        {
            ["Jwt:Key"] = Key,
            ["Jwt:Issuer"] = Issuer,
            ["Jwt:Audience"] = Audience,
            ["Jwt:ExpiryMinutes"] = "60"
        };
        if (overrides is not null)
            foreach (var pair in overrides) settings[pair.Key] = pair.Value;

        var configuration = new ConfigurationBuilder().AddInMemoryCollection(settings).Build();
        return new TokenService(configuration, _identity.UserManager);
    }

    private async Task<ApplicationUser> CreateUserAsync(string email, int? teamId = null, params string[] roles)
    {
        var user = new ApplicationUser { UserName = email, Email = email, TeamId = teamId };
        if (teamId is not null)
        {
            var team = await _identity.Context.AddTeamAsync($"team-{teamId}");
            user.TeamId = team.Id;
        }

        var created = await _identity.UserManager.CreateAsync(user, "Passw0rd!");
        created.Succeeded.Should().BeTrue(string.Join(", ", created.Errors.Select(e => e.Description)));

        foreach (var role in roles)
        {
            if (!await _identity.RoleManager.RoleExistsAsync(role))
                await _identity.RoleManager.CreateAsync(new Microsoft.AspNetCore.Identity.IdentityRole(role));
            await _identity.UserManager.AddToRoleAsync(user, role);
        }

        return user;
    }

    private static JwtSecurityToken Read(string token) => new JwtSecurityTokenHandler().ReadJwtToken(token);

    [Fact]
    public async Task GenerateTokenAsync_ContainsSubjectEmailAndName()
    {
        var user = await CreateUserAsync("coach@x.pl");

        var jwt = Read(await CreateSut().GenerateTokenAsync(user));

        jwt.Subject.Should().Be(user.Id);
        jwt.Claims.Should().Contain(c => c.Type == JwtRegisteredClaimNames.Email && c.Value == "coach@x.pl");
        jwt.Claims.Should().Contain(c => c.Type == ClaimTypes.Name || c.Type == "unique_name");
    }

    [Fact]
    public async Task GenerateTokenAsync_ContainsAllUserRoles()
    {
        var user = await CreateUserAsync("multi@x.pl", null, Roles.Coach, Roles.Analyst);

        var jwt = Read(await CreateSut().GenerateTokenAsync(user));

        var roles = jwt.Claims
            .Where(c => c.Type == ClaimTypes.Role || c.Type == "role")
            .Select(c => c.Value);
        roles.Should().BeEquivalentTo(Roles.Coach, Roles.Analyst);
    }

    [Fact]
    public async Task GenerateTokenAsync_HasNoRoleClaims_ForUserWithoutRoles()
    {
        var user = await CreateUserAsync("norole@x.pl");

        var jwt = Read(await CreateSut().GenerateTokenAsync(user));

        jwt.Claims.Should().NotContain(c => c.Type == ClaimTypes.Role || c.Type == "role");
    }

    [Fact]
    public async Task GenerateTokenAsync_AddsTeamIdClaim_WhenUserHasTeam()
    {
        var user = await CreateUserAsync("staff@x.pl", teamId: 1, Roles.Coach);

        var jwt = Read(await CreateSut().GenerateTokenAsync(user));

        jwt.Claims.Should().Contain(c => c.Type == "teamId" && c.Value == user.TeamId.ToString());
    }

    [Fact]
    public async Task GenerateTokenAsync_OmitsTeamIdClaim_WhenUserHasNoTeam()
    {
        var user = await CreateUserAsync("admin@x.pl", null, Roles.Admin);

        var jwt = Read(await CreateSut().GenerateTokenAsync(user));

        jwt.Claims.Should().NotContain(c => c.Type == "teamId");
    }

    [Fact]
    public async Task GenerateTokenAsync_SetsIssuerAudienceAndExpiry()
    {
        var user = await CreateUserAsync("exp@x.pl");

        var jwt = Read(await CreateSut(new() { ["Jwt:ExpiryMinutes"] = "15" }).GenerateTokenAsync(user));

        jwt.Issuer.Should().Be(Issuer);
        jwt.Audiences.Should().ContainSingle().Which.Should().Be(Audience);
        jwt.ValidTo.Should().BeCloseTo(DateTime.UtcNow.AddMinutes(15), TimeSpan.FromMinutes(1));
    }

    [Fact]
    public async Task GenerateTokenAsync_ProducesTokenValidatedByTheConfiguredKey()
    {
        var user = await CreateUserAsync("valid@x.pl", null, Roles.Coach);
        var token = await CreateSut().GenerateTokenAsync(user);

        var parameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = Issuer,
            ValidateAudience = true,
            ValidAudience = Audience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Key))
        };

        var principal = new JwtSecurityTokenHandler().ValidateToken(token, parameters, out _);

        principal.Should().NotBeNull();
    }

    [Fact]
    public async Task GenerateTokenAsync_IsRejectedWhenValidatedWithDifferentKey()
    {
        var user = await CreateUserAsync("wrongkey@x.pl");
        var token = await CreateSut().GenerateTokenAsync(user);

        var parameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("a-completely-different-key-of-sufficient-length"))
        };

        var act = () => new JwtSecurityTokenHandler().ValidateToken(token, parameters, out _);

        act.Should().Throw<SecurityTokenException>();
    }

    [Fact]
    public async Task GenerateTokenAsync_Throws_WhenSigningKeyIsMissing()
    {
        var user = await CreateUserAsync("nokey@x.pl");

        var act = () => CreateSut(new() { ["Jwt:Key"] = null }).GenerateTokenAsync(user);

        await act.Should().ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public async Task GenerateTokenAsync_Throws_WhenExpiryIsNotANumber()
    {
        var user = await CreateUserAsync("badexpiry@x.pl");

        var act = () => CreateSut(new() { ["Jwt:ExpiryMinutes"] = "soon" }).GenerateTokenAsync(user);

        await act.Should().ThrowAsync<FormatException>();
    }
}
