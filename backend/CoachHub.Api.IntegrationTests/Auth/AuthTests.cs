using System.Net;
using System.Net.Http.Json;
using CoachHub.Api.Data;
using CoachHub.Api.DTOs;

namespace CoachHub.Api.IntegrationTests.Auth;

public class AuthTests : ApiTestBase
{
    private const string Password = "Passw0rd!";

    public AuthTests(CoachHubFactory factory) : base(factory) { }

    private static LoginRequest Login(string email, string password) => new() { Email = email, Password = password };

    private static RegisterRequest Register(string role, int? teamId, string? email = null, string password = Password) => new()
    {
        Email = email ?? $"new-{Guid.NewGuid():N}@test.local",
        Password = password,
        Role = role,
        TeamId = teamId,
        FullName = "New Person"
    };

    // ---------- login ----------

    [Fact]
    public async Task Login_ReturnsTokenRolesAndTeam_ForValidCredentials()
    {
        var world = await NewWorldAsync();
        var user = await Factory.CreateUserAsync(Roles.Coach, world.Team.Id, Password);

        var response = await world.Anonymous().PostAsJsonAsync("/api/auth/login", Login(user.Email, Password));

        ShouldBe(response, HttpStatusCode.OK);
        var auth = await ReadAsync<AuthResponse>(response);
        auth.Token.Should().NotBeNullOrWhiteSpace();
        auth.Email.Should().Be(user.Email);
        auth.Roles.Should().Equal(Roles.Coach);
        auth.TeamId.Should().Be(world.Team.Id);
    }

    [Fact]
    public async Task Login_TokenGrantsAccessToProtectedEndpoints()
    {
        var world = await NewWorldAsync();
        var user = await Factory.CreateUserAsync(Roles.Coach, world.Team.Id, Password);
        var auth = await ReadAsync<AuthResponse>(
            await world.Anonymous().PostAsJsonAsync("/api/auth/login", Login(user.Email, Password)));

        var client = Factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new("Bearer", auth.Token);
        var response = await client.GetAsync("/api/players");

        ShouldBe(response, HttpStatusCode.OK);
    }

    [Fact]
    public async Task Login_WorksForTheSeededAdmin()
    {
        var response = await Factory.ClientFor()
            .PostAsJsonAsync("/api/auth/login", Login("admin@coachhub.local", CoachHubFactory.SeedAdminPassword));

        ShouldBe(response, HttpStatusCode.OK);
        var auth = await ReadAsync<AuthResponse>(response);
        auth.Roles.Should().Equal(Roles.Admin);
        auth.TeamId.Should().BeNull();
    }

    [Fact]
    public async Task Login_Returns401_ForWrongPassword()
    {
        var user = await Factory.CreateUserAsync(Roles.Coach, null, Password);

        var response = await Factory.ClientFor().PostAsJsonAsync("/api/auth/login", Login(user.Email, "Wr0ng-Password!"));

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_Returns401_ForUnknownEmail()
    {
        var response = await Factory.ClientFor().PostAsJsonAsync("/api/auth/login", Login("nobody@test.local", Password));

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_Returns400_WhenBodyIsIncomplete()
    {
        var response = await Factory.ClientFor().PostAsJsonAsync("/api/auth/login", new { email = "x@test.local" });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ---------- register ----------

    [Fact]
    public async Task Register_CreatesUserThatCanLogIn_AndReturnsToken()
    {
        var world = await NewWorldAsync();
        var request = Register(Roles.Analyst, world.Team.Id);

        var response = await world.As(world.Admin).PostAsJsonAsync("/api/auth/register", request);

        ShouldBe(response, HttpStatusCode.OK);
        var auth = await ReadAsync<AuthResponse>(response);
        auth.Token.Should().NotBeNullOrWhiteSpace();
        auth.Roles.Should().Equal(Roles.Analyst);
        auth.TeamId.Should().Be(world.Team.Id);

        var login = await world.Anonymous().PostAsJsonAsync("/api/auth/login", Login(request.Email, Password));
        ShouldBe(login, HttpStatusCode.OK);
    }

    [Fact]
    public async Task Register_PersistsFullName()
    {
        var world = await NewWorldAsync();
        var request = Register(Roles.Coach, world.Team.Id);

        await world.As(world.Admin).PostAsJsonAsync("/api/auth/register", request);

        var users = await ReadAsync<List<UserSummary>>(await world.As(world.Admin).GetAsync("/api/users"));
        users.Single(u => u.Email == request.Email).FullName.Should().Be("New Person");
    }

    [Fact]
    public async Task Register_Admin_IgnoresTeamId()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Admin)
            .PostAsJsonAsync("/api/auth/register", Register(Roles.Admin, world.Team.Id));

        ShouldBe(response, HttpStatusCode.OK);
        (await ReadAsync<AuthResponse>(response)).TeamId.Should().BeNull();
    }

    [Fact]
    public async Task Register_Admin_DoesNotRequireTeam()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Admin).PostAsJsonAsync("/api/auth/register", Register(Roles.Admin, null));

        ShouldBe(response, HttpStatusCode.OK);
    }

    [Fact]
    public async Task Register_Returns400_ForUnknownRole()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Admin).PostAsJsonAsync("/api/auth/register", Register("Wizard", world.Team.Id));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Theory]
    [InlineData(Roles.Coach)]
    [InlineData(Roles.AssistantCoach)]
    [InlineData(Roles.Analyst)]
    public async Task Register_Returns400_WhenStaffRoleHasNoTeam(string role)
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Admin).PostAsJsonAsync("/api/auth/register", Register(role, null));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Register_Returns400_WhenTeamDoesNotExist()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Admin).PostAsJsonAsync("/api/auth/register", Register(Roles.Coach, 999_999));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Register_Returns400_ForPasswordThatViolatesPolicy()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Admin)
            .PostAsJsonAsync("/api/auth/register", Register(Roles.Coach, world.Team.Id, password: "weak"));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Register_Returns400_ForDuplicateEmail()
    {
        var world = await NewWorldAsync();
        var request = Register(Roles.Coach, world.Team.Id);
        await world.As(world.Admin).PostAsJsonAsync("/api/auth/register", request);

        var response = await world.As(world.Admin).PostAsJsonAsync("/api/auth/register", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Theory]
    [InlineData(Roles.Coach)]
    [InlineData(Roles.AssistantCoach)]
    [InlineData(Roles.Analyst)]
    public async Task Register_Returns403_ForNonAdmins(string role)
    {
        var world = await NewWorldAsync();
        var caller = role switch
        {
            Roles.Coach => world.Coach,
            Roles.AssistantCoach => world.Assistant,
            _ => world.Analyst
        };

        var response = await world.As(caller).PostAsJsonAsync("/api/auth/register", Register(Roles.Analyst, world.Team.Id));

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Register_Returns401_ForAnonymousCaller()
    {
        var world = await NewWorldAsync();

        var response = await world.Anonymous().PostAsJsonAsync("/api/auth/register", Register(Roles.Analyst, world.Team.Id));

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Register_ReturnedTokenOfNewAdmin_GrantsAdminAccess()
    {
        var world = await NewWorldAsync();
        var auth = await ReadAsync<AuthResponse>(
            await world.As(world.Admin).PostAsJsonAsync("/api/auth/register", Register(Roles.Admin, null)));

        var client = Factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new("Bearer", auth.Token);

        (await client.GetAsync("/api/users")).StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
