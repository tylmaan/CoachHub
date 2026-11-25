using System.Net;
using System.Net.Http.Json;
using CoachHub.Api.Data;
using CoachHub.Api.DTOs;
using CoachHub.Api.Models;
using CoachHub.Api.UnitTests.Helpers;
using Microsoft.EntityFrameworkCore;

namespace CoachHub.Api.IntegrationTests.Controllers;

public class TeamsTests : ApiTestBase
{
    public TeamsTests(CoachHubFactory factory) : base(factory) { }

    private static object Kit(string pattern = "Solid", string primary = "#112233", string secondary = "#ffffff") =>
        new { pattern, primaryColor = primary, secondaryColor = secondary };

    private static object TeamBody(
        string name = "FC Test",
        string? countryCode = "pl",
        string? league = "Ekstraklasa",
        object? homeKit = null,
        object? awayKit = null,
        object? goalkeeperKit = null) => new
    {
        name,
        countryCode,
        league,
        homeKit = homeKit ?? Kit(),
        awayKit = awayKit ?? Kit("Halves", "#aa0000", "#0000aa"),
        goalkeeperKit = goalkeeperKit ?? Kit("Sash", "#00aa00", "#000000")
    };

    // ---------- read ----------

    [Fact]
    public async Task GetAll_ForAdmin_ReturnsEveryTeamWithStaff()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Admin).GetAsync("/api/teams");

        ShouldBe(response, HttpStatusCode.OK);
        var teams = await ReadAsync<List<TeamSummary>>(response);
        teams.Select(t => t.Id).Should().Contain(new[] { world.Team.Id, world.OtherTeam.Id });
        var team = teams.Single(t => t.Id == world.Team.Id);
        team.StaffMembers.Select(s => s.Email).Should().BeEquivalentTo(
            new[] { world.Coach.Email, world.Assistant.Email, world.Analyst.Email });
        team.StaffMembers.Single(s => s.Id == world.Coach.Id).Roles.Should().Equal(Roles.Coach);
    }

    [Fact]
    public async Task GetAll_ForStaff_ReturnsOnlyTheirOwnTeam()
    {
        var world = await NewWorldAsync();

        var teams = await ReadAsync<List<TeamSummary>>(await world.As(world.Coach).GetAsync("/api/teams"));

        teams.Should().ContainSingle().Which.Id.Should().Be(world.Team.Id);
    }

    [Fact]
    public async Task GetAll_ForStaffWithoutTeam_ReturnsEmptyList()
    {
        var world = await NewWorldAsync();
        var drifter = await Factory.CreateUserAsync(Roles.Analyst, null);

        var teams = await ReadAsync<List<TeamSummary>>(await world.As(drifter).GetAsync("/api/teams"));

        teams.Should().BeEmpty();
    }

    [Fact]
    public async Task GetAll_NeverLeaksPasswordHashesOrSecurityStamps()
    {
        var world = await NewWorldAsync();
        await Factory.CreateUserAsync(Roles.Coach, world.Team.Id, "Passw0rd!");

        var raw = await (await world.As(world.Admin).GetAsync("/api/teams")).Content.ReadAsStringAsync();

        raw.Should().NotContainEquivalentOf("passwordHash");
        raw.Should().NotContainEquivalentOf("securityStamp");
    }

    [Fact]
    public async Task GetById_StaffSeesOwnTeam_ButNotForeignTeam()
    {
        var world = await NewWorldAsync();

        ShouldBe(await world.As(world.Coach).GetAsync($"/api/teams/{world.Team.Id}"), HttpStatusCode.OK);
        ShouldBe(await world.As(world.Coach).GetAsync($"/api/teams/{world.OtherTeam.Id}"), HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task GetById_AdminSeesAnyTeam_AndGets404ForMissing()
    {
        var world = await NewWorldAsync();

        var ok = await world.As(world.Admin).GetAsync($"/api/teams/{world.OtherTeam.Id}");
        ShouldBe(ok, HttpStatusCode.OK);
        (await ReadAsync<Team>(ok)).Name.Should().Be(world.OtherTeam.Name);

        ShouldBe(await world.As(world.Admin).GetAsync("/api/teams/999999"), HttpStatusCode.NotFound);
    }

    // ---------- create ----------

    [Fact]
    public async Task Create_PersistsTeamWithKitsAndReturnsLocation()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Admin).PostAsJsonAsync("/api/teams", TeamBody("Created FC"));

        ShouldBe(response, HttpStatusCode.Created);
        response.Headers.Location.Should().NotBeNull();
        var created = await ReadAsync<Team>(response);
        var saved = await Factory.WithDbAsync(db => db.Teams.SingleAsync(t => t.Id == created.Id));
        saved.Name.Should().Be("Created FC");
        saved.CountryCode.Should().Be("pl");
        saved.League.Should().Be("Ekstraklasa");
        saved.HomeKit.PrimaryColor.Should().Be("#112233");
        saved.AwayKit.Pattern.Should().Be("Halves");
        saved.GoalkeeperKit.Pattern.Should().Be("Sash");
    }

    [Fact]
    public async Task Create_AllowsMissingCountryAndLeague()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Admin)
            .PostAsJsonAsync("/api/teams", TeamBody(countryCode: null, league: null));

        ShouldBe(response, HttpStatusCode.Created);
    }

    [Fact]
    public async Task Create_Returns400_WhenNameIsMissing()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Admin).PostAsJsonAsync("/api/teams", new { countryCode = "pl" });

        ShouldBe(response, HttpStatusCode.BadRequest);
    }

    [Theory]
    [InlineData("PL")]
    [InlineData("pol")]
    [InlineData("p")]
    [InlineData("1a")]
    [InlineData("")]
    public async Task Create_Returns400_ForInvalidCountryCode(string code)
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Admin).PostAsJsonAsync("/api/teams", TeamBody(countryCode: code));

        ShouldBe(response, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Create_Returns400_ForEmptyOrTooLongLeague()
    {
        var world = await NewWorldAsync();
        var admin = world.As(world.Admin);

        ShouldBe(await admin.PostAsJsonAsync("/api/teams", TeamBody(league: "")), HttpStatusCode.BadRequest);
        ShouldBe(await admin.PostAsJsonAsync("/api/teams", TeamBody(league: new string('x', 101))), HttpStatusCode.BadRequest);
        ShouldBe(await admin.PostAsJsonAsync("/api/teams", TeamBody(league: new string('x', 100))), HttpStatusCode.Created);
    }

    [Theory]
    [InlineData("Stars", "#112233", "#ffffff")]
    [InlineData("Solid", "red", "#ffffff")]
    [InlineData("Solid", "#12345", "#ffffff")]
    [InlineData("Solid", "#1234567", "#ffffff")]
    [InlineData("Solid", "#GGGGGG", "#ffffff")]
    [InlineData("Solid", "#112233", "blue")]
    public async Task Create_Returns400_ForInvalidKit(string pattern, string primary, string secondary)
    {
        var world = await NewWorldAsync();

        foreach (var body in new[]
        {
            TeamBody(homeKit: Kit(pattern, primary, secondary)),
            TeamBody(awayKit: Kit(pattern, primary, secondary)),
            TeamBody(goalkeeperKit: Kit(pattern, primary, secondary))
        })
        {
            ShouldBe(await world.As(world.Admin).PostAsJsonAsync("/api/teams", body), HttpStatusCode.BadRequest);
        }
    }

    [Theory]
    [InlineData("Solid")]
    [InlineData("HorizontalStripes")]
    [InlineData("VerticalStripes")]
    [InlineData("Halves")]
    [InlineData("Sash")]
    [InlineData("Quarters")]
    public async Task Create_AcceptsEveryKitPattern(string pattern)
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Admin).PostAsJsonAsync("/api/teams", TeamBody(homeKit: Kit(pattern)));

        ShouldBe(response, HttpStatusCode.Created);
    }

    // ---------- update ----------

    [Fact]
    public async Task Update_ChangesTeam()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Admin).PutAsJsonAsync(
            $"/api/teams/{world.SpareTeam.Id}", TeamBody("Renamed FC", "de", "Bundesliga"));

        ShouldBe(response, HttpStatusCode.NoContent);
        var saved = await Factory.WithDbAsync(db => db.Teams.SingleAsync(t => t.Id == world.SpareTeam.Id));
        saved.Name.Should().Be("Renamed FC");
        saved.CountryCode.Should().Be("de");
        saved.League.Should().Be("Bundesliga");
    }

    [Fact]
    public async Task Update_Returns400_ForInvalidData_AndKeepsTheTeamUnchanged()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Admin).PutAsJsonAsync(
            $"/api/teams/{world.SpareTeam.Id}", TeamBody("Hacked", countryCode: "POL"));

        ShouldBe(response, HttpStatusCode.BadRequest);
        var saved = await Factory.WithDbAsync(db => db.Teams.SingleAsync(t => t.Id == world.SpareTeam.Id));
        saved.Name.Should().Be(world.SpareTeam.Name);
    }

    [Fact]
    public async Task Update_Returns404_ForMissingTeam()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Admin).PutAsJsonAsync("/api/teams/999999", TeamBody());

        ShouldBe(response, HttpStatusCode.NotFound);
    }

    // ---------- delete ----------

    [Fact]
    public async Task Delete_RemovesTeam()
    {
        var world = await NewWorldAsync();

        ShouldBe(await world.As(world.Admin).DeleteAsync($"/api/teams/{world.SpareTeam.Id}"), HttpStatusCode.NoContent);
        ShouldBe(await world.As(world.Admin).GetAsync($"/api/teams/{world.SpareTeam.Id}"), HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Delete_Returns404_ForMissingTeam()
    {
        var world = await NewWorldAsync();

        ShouldBe(await world.As(world.Admin).DeleteAsync("/api/teams/999999"), HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Delete_CascadesToPlayersMatchesAndReports()
    {
        var world = await NewWorldAsync();
        var author = await Factory.CreateUserAsync(Roles.Analyst, null);
        var (playerId, matchId, reportId) = await Factory.WithDbAsync(async db =>
        {
            var player = await db.AddPlayerAsync(world.SpareTeam.Id);
            var match = await db.AddMatchAsync(world.SpareTeam.Id);
            var report = await db.AddReportAsync(author.Id, teamId: world.SpareTeam.Id);
            return (player.Id, match.Id, report.Id);
        });

        ShouldBe(await world.As(world.Admin).DeleteAsync($"/api/teams/{world.SpareTeam.Id}"), HttpStatusCode.NoContent);

        await Factory.WithDbAsync(async db =>
        {
            (await db.Players.AnyAsync(p => p.Id == playerId)).Should().BeFalse();
            (await db.Matches.AnyAsync(m => m.Id == matchId)).Should().BeFalse();
            (await db.Reports.AnyAsync(r => r.Id == reportId)).Should().BeFalse();
        });
    }

    // Known defects: the delete fails with an unhandled DbUpdateException
    // ("FOREIGN KEY constraint failed" -> HTTP 500) instead of a handled response.
    // Expected once fixed: 204 (with a defined clean-up of the dependents) or 409 Conflict.

    private async Task<HttpStatusCode> DeleteTeamAsStatusAsync(World world, int teamId)
    {
        var response = await world.As(world.Admin).DeleteAsync($"/api/teams/{teamId}");
        return response.StatusCode;
    }

    [Fact(Skip = "Known bug: deleting a team that has staff members (ApplicationUser.TeamId) throws FOREIGN KEY constraint failed (500)")]
    public async Task Delete_TeamWithStaff_IsHandledGracefully()
    {
        var world = await NewWorldAsync();
        var team = await Factory.WithDbAsync(db => db.AddTeamAsync("with staff"));
        await Factory.CreateUserAsync(Roles.Coach, team.Id);

        (await DeleteTeamAsStatusAsync(world, team.Id)).Should().BeOneOf(HttpStatusCode.NoContent, HttpStatusCode.Conflict);
    }

    [Fact(Skip = "Known bug: deleting a team whose players have match appearances throws FOREIGN KEY constraint failed (500)")]
    public async Task Delete_TeamWhosePlayersHaveAppearances_IsHandledGracefully()
    {
        var world = await NewWorldAsync();
        var team = await Factory.WithDbAsync(async db =>
        {
            var t = await db.AddTeamAsync("with appearances");
            var player = await db.AddPlayerAsync(t.Id);
            var match = await db.AddMatchAsync(t.Id);
            await db.AddAppearanceAsync(match.Id, player.Id);
            return t;
        });

        (await DeleteTeamAsStatusAsync(world, team.Id)).Should().BeOneOf(HttpStatusCode.NoContent, HttpStatusCode.Conflict);
    }

    [Fact(Skip = "Known bug: deleting a team whose players have match events throws FOREIGN KEY constraint failed (500)")]
    public async Task Delete_TeamWhosePlayersHaveEvents_IsHandledGracefully()
    {
        var world = await NewWorldAsync();
        var team = await Factory.WithDbAsync(async db =>
        {
            var t = await db.AddTeamAsync("with events");
            var player = await db.AddPlayerAsync(t.Id);
            var match = await db.AddMatchAsync(t.Id);
            await db.AddEventAsync(match.Id, "Goal", player.Id, 5);
            return t;
        });

        (await DeleteTeamAsStatusAsync(world, team.Id)).Should().BeOneOf(HttpStatusCode.NoContent, HttpStatusCode.Conflict);
    }
}
