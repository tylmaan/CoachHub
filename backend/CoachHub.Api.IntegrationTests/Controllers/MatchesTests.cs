using System.Net;
using System.Net.Http.Json;
using CoachHub.Api.Data;
using CoachHub.Api.Models;
using CoachHub.Api.UnitTests.Helpers;
using Microsoft.EntityFrameworkCore;

namespace CoachHub.Api.IntegrationTests.Controllers;

public class MatchesTests : ApiTestBase
{
    public MatchesTests(CoachHubFactory factory) : base(factory) { }

    private static object MatchBody(
        int teamId,
        string status = "Planned",
        int? scoreFor = null,
        int? scoreAgainst = null,
        string opponent = "Rival FC",
        string? gamePlan = null) => new
    {
        teamId,
        status,
        scoreFor,
        scoreAgainst,
        opponent,
        season = "2025/26",
        date = "2025-10-05",
        isHome = true,
        matchType = "League",
        competition = "Ekstraklasa",
        round = "10",
        formation = "4-3-3",
        gamePlan
    };

    // ---------- read ----------

    [Fact]
    public async Task GetAll_ReturnsOnlyMatchesOfTheCallersTeam()
    {
        var world = await NewWorldAsync();

        var matches = await ReadAsync<List<Match>>(await world.As(world.Analyst).GetAsync("/api/matches"));

        matches.Select(m => m.Id).Should().BeEquivalentTo(new[] { world.PlannedMatch.Id, world.PlayedMatch.Id });
    }

    [Fact]
    public async Task GetAll_ForStaffWithoutTeam_ReturnsEmptyList()
    {
        var world = await NewWorldAsync();
        var drifter = await Factory.CreateUserAsync(Roles.Analyst, null);

        (await ReadAsync<List<Match>>(await world.As(drifter).GetAsync("/api/matches"))).Should().BeEmpty();
    }

    [Fact]
    public async Task GetById_ReturnsOwn_ForbidsForeign_404sMissing()
    {
        var world = await NewWorldAsync();
        var client = world.As(world.Coach);

        var own = await client.GetAsync($"/api/matches/{world.PlayedMatch.Id}");
        ShouldBe(own, HttpStatusCode.OK);
        (await ReadAsync<Match>(own)).ScoreFor.Should().Be(2);

        ShouldBe(await client.GetAsync($"/api/matches/{world.OtherMatch.Id}"), HttpStatusCode.Forbidden);
        ShouldBe(await client.GetAsync("/api/matches/999999"), HttpStatusCode.NotFound);
    }

    // ---------- create ----------

    [Fact]
    public async Task Create_PlannedMatch_Persists()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Coach).PostAsJsonAsync("/api/matches", MatchBody(world.Team.Id));

        ShouldBe(response, HttpStatusCode.Created);
        response.Headers.Location.Should().NotBeNull();
        var created = await ReadAsync<Match>(response);
        var saved = await Factory.WithDbAsync(db => db.Matches.SingleAsync(m => m.Id == created.Id));
        saved.Status.Should().Be("Planned");
        saved.Opponent.Should().Be("Rival FC");
        saved.Formation.Should().Be("4-3-3");
        saved.ScoreFor.Should().BeNull();
    }

    [Fact]
    public async Task Create_PlayedMatchWithScore_Persists()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Assistant)
            .PostAsJsonAsync("/api/matches", MatchBody(world.Team.Id, "Played", 3, 0));

        ShouldBe(response, HttpStatusCode.Created);
        var created = await ReadAsync<Match>(response);
        created.ScoreFor.Should().Be(3);
        created.ScoreAgainst.Should().Be(0);
    }

    [Fact]
    public async Task Create_IgnoresNotesSentByTheClient()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Coach)
            .PostAsJsonAsync("/api/matches", MatchBody(world.Team.Id, gamePlan: "smuggled plan"));

        var created = await ReadAsync<Match>(response);
        created.GamePlan.Should().BeNull();
        created.OpponentNotes.Should().BeNull();
    }

    [Theory]
    [InlineData("Cancelled", null, null)]
    [InlineData("planned", null, null)]
    [InlineData("Played", null, null)]
    [InlineData("Played", 1, null)]
    [InlineData("Played", null, 1)]
    [InlineData("Played", -1, 0)]
    [InlineData("Played", 0, -3)]
    [InlineData("Planned", 1, 0)]
    [InlineData("Planned", 0, null)]
    public async Task Create_Returns400_ForInconsistentStatusAndScore(string status, int? scoreFor, int? scoreAgainst)
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Coach)
            .PostAsJsonAsync("/api/matches", MatchBody(world.Team.Id, status, scoreFor, scoreAgainst));

        ShouldBe(response, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Create_Allows_ZeroZeroDraw()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Coach)
            .PostAsJsonAsync("/api/matches", MatchBody(world.Team.Id, "Played", 0, 0));

        ShouldBe(response, HttpStatusCode.Created);
    }

    [Fact]
    public async Task Create_Forbids_MatchForForeignTeam()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Coach).PostAsJsonAsync("/api/matches", MatchBody(world.OtherTeam.Id));

        ShouldBe(response, HttpStatusCode.Forbidden);
    }

    // ---------- update ----------

    [Fact]
    public async Task Update_PlannedMatchToPlayed_PersistsResult_AndKeepsNotes()
    {
        var world = await NewWorldAsync();
        await world.As(world.Coach).PutAsJsonAsync(
            $"/api/matches/{world.PlannedMatch.Id}/game-plan", new { text = "Press high" });

        var response = await world.As(world.Coach).PutAsJsonAsync(
            $"/api/matches/{world.PlannedMatch.Id}", MatchBody(world.Team.Id, "Played", 2, 2, "Changed FC"));

        ShouldBe(response, HttpStatusCode.NoContent);
        var saved = await Factory.WithDbAsync(db => db.Matches.SingleAsync(m => m.Id == world.PlannedMatch.Id));
        saved.Status.Should().Be("Played");
        saved.ScoreFor.Should().Be(2);
        saved.Opponent.Should().Be("Changed FC");
        saved.GamePlan.Should().Be("Press high");
    }

    [Fact]
    public async Task Update_DoesNotMoveMatchToAnotherTeam()
    {
        var world = await NewWorldAsync();

        await world.As(world.Coach).PutAsJsonAsync(
            $"/api/matches/{world.PlannedMatch.Id}", MatchBody(world.OtherTeam.Id));

        var saved = await Factory.WithDbAsync(db => db.Matches.SingleAsync(m => m.Id == world.PlannedMatch.Id));
        saved.TeamId.Should().Be(world.Team.Id);
    }

    [Fact]
    public async Task Update_Returns400_ForInvalidStatus()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Coach).PutAsJsonAsync(
            $"/api/matches/{world.PlannedMatch.Id}", MatchBody(world.Team.Id, "Played"));

        ShouldBe(response, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Update_Forbids_Foreign_And404sMissing()
    {
        var world = await NewWorldAsync();
        var coach = world.As(world.Coach);

        ShouldBe(await coach.PutAsJsonAsync($"/api/matches/{world.OtherMatch.Id}", MatchBody(world.Team.Id)),
            HttpStatusCode.Forbidden);
        ShouldBe(await coach.PutAsJsonAsync("/api/matches/999999", MatchBody(world.Team.Id)),
            HttpStatusCode.NotFound);
    }

    // ---------- notes ----------

    [Fact]
    public async Task GamePlan_CanBeSetByCoachAndAssistant_AndBlankClearsIt()
    {
        var world = await NewWorldAsync();
        var url = $"/api/matches/{world.PlannedMatch.Id}/game-plan";

        ShouldBe(await world.As(world.Coach).PutAsJsonAsync(url, new { text = "From coach" }), HttpStatusCode.NoContent);
        (await GetMatchAsync(world.PlannedMatch.Id)).GamePlan.Should().Be("From coach");

        ShouldBe(await world.As(world.Assistant).PutAsJsonAsync(url, new { text = "From assistant" }), HttpStatusCode.NoContent);
        (await GetMatchAsync(world.PlannedMatch.Id)).GamePlan.Should().Be("From assistant");

        ShouldBe(await world.As(world.Coach).PutAsJsonAsync(url, new { text = "   " }), HttpStatusCode.NoContent);
        (await GetMatchAsync(world.PlannedMatch.Id)).GamePlan.Should().BeNull();
    }

    [Fact]
    public async Task OpponentNotes_CanBeSetByAnalyst_ButGamePlanCannot()
    {
        var world = await NewWorldAsync();
        var analyst = world.As(world.Analyst);

        ShouldBe(await analyst.PutAsJsonAsync(
            $"/api/matches/{world.PlannedMatch.Id}/opponent-notes", new { text = "Slow centre-backs" }),
            HttpStatusCode.NoContent);
        (await GetMatchAsync(world.PlannedMatch.Id)).OpponentNotes.Should().Be("Slow centre-backs");

        ShouldBe(await analyst.PutAsJsonAsync(
            $"/api/matches/{world.PlannedMatch.Id}/game-plan", new { text = "nope" }),
            HttpStatusCode.Forbidden);
    }

    [Theory]
    [InlineData("game-plan")]
    [InlineData("opponent-notes")]
    public async Task Notes_CanOnlyBeEditedOnPlannedMatches(string note)
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Coach).PutAsJsonAsync(
            $"/api/matches/{world.PlayedMatch.Id}/{note}", new { text = "too late" });

        ShouldBe(response, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Notes_AreLimitedTo4000Characters()
    {
        var world = await NewWorldAsync();
        var coach = world.As(world.Coach);
        var url = $"/api/matches/{world.PlannedMatch.Id}/game-plan";

        ShouldBe(await coach.PutAsJsonAsync(url, new { text = new string('x', 4000) }), HttpStatusCode.NoContent);
        ShouldBe(await coach.PutAsJsonAsync(url, new { text = new string('x', 4001) }), HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Notes_Forbid_ForeignMatch_And404ForMissing()
    {
        var world = await NewWorldAsync();
        var coach = world.As(world.Coach);

        ShouldBe(await coach.PutAsJsonAsync($"/api/matches/{world.OtherMatch.Id}/game-plan", new { text = "x" }),
            HttpStatusCode.Forbidden);
        ShouldBe(await coach.PutAsJsonAsync("/api/matches/999999/game-plan", new { text = "x" }),
            HttpStatusCode.NotFound);
    }

    // ---------- delete ----------

    [Fact]
    public async Task Delete_RemovesMatchWithItsLineupAndEvents()
    {
        var world = await NewWorldAsync();

        ShouldBe(await world.As(world.Coach).DeleteAsync($"/api/matches/{world.PlayedMatch.Id}"), HttpStatusCode.NoContent);

        await Factory.WithDbAsync(async db =>
        {
            (await db.Matches.AnyAsync(m => m.Id == world.PlayedMatch.Id)).Should().BeFalse();
            (await db.MatchAppearances.AnyAsync(a => a.Id == world.Appearance.Id)).Should().BeFalse();
            (await db.MatchEvents.AnyAsync(e => e.Id == world.Event.Id)).Should().BeFalse();
            (await db.Players.AnyAsync(p => p.Id == world.Player.Id)).Should().BeTrue();
        });
    }

    [Fact]
    public async Task Delete_Forbids_Foreign_And404sMissing()
    {
        var world = await NewWorldAsync();
        var coach = world.As(world.Coach);

        ShouldBe(await coach.DeleteAsync($"/api/matches/{world.OtherMatch.Id}"), HttpStatusCode.Forbidden);
        ShouldBe(await coach.DeleteAsync("/api/matches/999999"), HttpStatusCode.NotFound);
    }

    private Task<Match> GetMatchAsync(int id) => Factory.WithDbAsync(db => db.Matches.AsNoTracking().SingleAsync(m => m.Id == id));
}
