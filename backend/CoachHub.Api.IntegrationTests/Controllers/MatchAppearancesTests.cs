using System.Net;
using System.Net.Http.Json;
using CoachHub.Api.Models;
using CoachHub.Api.UnitTests.Helpers;
using Microsoft.EntityFrameworkCore;

namespace CoachHub.Api.IntegrationTests.Controllers;

public class MatchAppearancesTests : ApiTestBase
{
    public MatchAppearancesTests(CoachHubFactory factory) : base(factory) { }

    private static object Body(int matchId, int playerId, bool isStarting = true, string? position = "CM") =>
        new { matchId, playerId, isStarting, position };

    // ---------- read ----------

    [Fact]
    public async Task GetByMatch_ReturnsTheLineupOfAnOwnMatch()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Analyst).GetAsync($"/api/matchappearances/match/{world.PlayedMatch.Id}");

        ShouldBe(response, HttpStatusCode.OK);
        var lineup = await ReadAsync<List<MatchAppearance>>(response);
        lineup.Should().ContainSingle().Which.PlayerId.Should().Be(world.Player.Id);
    }

    [Fact]
    public async Task GetByMatch_Forbids_ForeignMatch_AndHidesWhetherAMatchExists()
    {
        var world = await NewWorldAsync();
        var coach = world.As(world.Coach);

        ShouldBe(await coach.GetAsync($"/api/matchappearances/match/{world.OtherMatch.Id}"), HttpStatusCode.Forbidden);
        ShouldBe(await coach.GetAsync("/api/matchappearances/match/999999"), HttpStatusCode.Forbidden);
    }

    // ---------- create ----------

    [Fact]
    public async Task Create_AddsPlayerToTheLineup()
    {
        var world = await NewWorldAsync();
        var teammate = await Factory.WithDbAsync(db => db.AddPlayerAsync(world.Team.Id, "Nowy", "Zawodnik"));

        var response = await world.As(world.Coach).PostAsJsonAsync(
            "/api/matchappearances", Body(world.PlannedMatch.Id, teammate.Id, false, "ST"));

        ShouldBe(response, HttpStatusCode.Created);
        var created = await ReadAsync<MatchAppearance>(response);
        var saved = await Factory.WithDbAsync(db => db.MatchAppearances.SingleAsync(a => a.Id == created.Id));
        saved.PlayerId.Should().Be(teammate.Id);
        saved.IsStarting.Should().BeFalse();
        saved.Position.Should().Be("ST");
    }

    [Fact]
    public async Task Create_Returns400_ForPlayerOfAnotherTeam()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Coach).PostAsJsonAsync(
            "/api/matchappearances", Body(world.PlannedMatch.Id, world.OtherPlayer.Id));

        ShouldBe(response, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Create_Returns400_ForUnknownPlayer()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Coach).PostAsJsonAsync(
            "/api/matchappearances", Body(world.PlannedMatch.Id, 999_999));

        ShouldBe(response, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Create_Returns400_ForArchivedPlayer()
    {
        var world = await NewWorldAsync();
        var archived = await Factory.WithDbAsync(db =>
            db.AddPlayerAsync(world.Team.Id, "Old", "Timer", archivedAt: new DateOnly(2025, 1, 1)));

        var response = await world.As(world.Coach).PostAsJsonAsync(
            "/api/matchappearances", Body(world.PlannedMatch.Id, archived.Id));

        ShouldBe(response, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Create_Forbids_ForeignOrMissingMatch()
    {
        var world = await NewWorldAsync();
        var coach = world.As(world.Coach);

        ShouldBe(await coach.PostAsJsonAsync("/api/matchappearances", Body(world.OtherMatch.Id, world.Player.Id)),
            HttpStatusCode.Forbidden);
        ShouldBe(await coach.PostAsJsonAsync("/api/matchappearances", Body(999_999, world.Player.Id)),
            HttpStatusCode.Forbidden);
    }

    // ---------- update ----------

    [Fact]
    public async Task Update_ChangesStartingFlagAndPosition()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Assistant).PutAsJsonAsync(
            $"/api/matchappearances/{world.Appearance.Id}", Body(world.PlayedMatch.Id, world.Player.Id, false, "LW"));

        ShouldBe(response, HttpStatusCode.NoContent);
        var saved = await Factory.WithDbAsync(db => db.MatchAppearances.SingleAsync(a => a.Id == world.Appearance.Id));
        saved.IsStarting.Should().BeFalse();
        saved.Position.Should().Be("LW");
    }

    [Fact]
    public async Task Update_CanSwapInAnotherTeammate()
    {
        var world = await NewWorldAsync();
        var teammate = await Factory.WithDbAsync(db => db.AddPlayerAsync(world.Team.Id, "Zmiennik", "Nowy"));

        var response = await world.As(world.Coach).PutAsJsonAsync(
            $"/api/matchappearances/{world.Appearance.Id}", Body(world.PlayedMatch.Id, teammate.Id));

        ShouldBe(response, HttpStatusCode.NoContent);
        var saved = await Factory.WithDbAsync(db => db.MatchAppearances.SingleAsync(a => a.Id == world.Appearance.Id));
        saved.PlayerId.Should().Be(teammate.Id);
    }

    [Fact]
    public async Task Update_Returns400_WhenSwappingInPlayerOfAnotherTeam_OrArchivedPlayer()
    {
        var world = await NewWorldAsync();
        var archived = await Factory.WithDbAsync(db =>
            db.AddPlayerAsync(world.Team.Id, "Old", "Timer", archivedAt: new DateOnly(2025, 1, 1)));
        var coach = world.As(world.Coach);

        ShouldBe(await coach.PutAsJsonAsync($"/api/matchappearances/{world.Appearance.Id}",
            Body(world.PlayedMatch.Id, world.OtherPlayer.Id)), HttpStatusCode.BadRequest);
        ShouldBe(await coach.PutAsJsonAsync($"/api/matchappearances/{world.Appearance.Id}",
            Body(world.PlayedMatch.Id, archived.Id)), HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Update_KeepsAnAlreadyArchivedPlayerInTheLineup_WhenThePlayerIsNotChanged()
    {
        var world = await NewWorldAsync();
        var coach = world.As(world.Coach);
        await coach.PostAsync($"/api/players/{world.Player.Id}/archive", null);

        var response = await coach.PutAsJsonAsync(
            $"/api/matchappearances/{world.Appearance.Id}", Body(world.PlayedMatch.Id, world.Player.Id, false, "RB"));

        ShouldBe(response, HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Update_Forbids_ForeignAppearance_And404sMissing()
    {
        var world = await NewWorldAsync();
        var foreign = await Factory.WithDbAsync(db => db.AddAppearanceAsync(world.OtherMatch.Id, world.OtherPlayer.Id));
        var coach = world.As(world.Coach);

        ShouldBe(await coach.PutAsJsonAsync($"/api/matchappearances/{foreign.Id}",
            Body(world.OtherMatch.Id, world.OtherPlayer.Id)), HttpStatusCode.Forbidden);
        ShouldBe(await coach.PutAsJsonAsync("/api/matchappearances/999999",
            Body(world.PlayedMatch.Id, world.Player.Id)), HttpStatusCode.NotFound);
    }

    // ---------- delete ----------

    [Fact]
    public async Task Delete_RemovesAppearance()
    {
        var world = await NewWorldAsync();

        ShouldBe(await world.As(world.Coach).DeleteAsync($"/api/matchappearances/{world.Appearance.Id}"),
            HttpStatusCode.NoContent);

        var exists = await Factory.WithDbAsync(db => db.MatchAppearances.AnyAsync(a => a.Id == world.Appearance.Id));
        exists.Should().BeFalse();
    }

    [Fact]
    public async Task Delete_Forbids_ForeignAppearance_And404sMissing()
    {
        var world = await NewWorldAsync();
        var foreign = await Factory.WithDbAsync(db => db.AddAppearanceAsync(world.OtherMatch.Id, world.OtherPlayer.Id));
        var coach = world.As(world.Coach);

        ShouldBe(await coach.DeleteAsync($"/api/matchappearances/{foreign.Id}"), HttpStatusCode.Forbidden);
        ShouldBe(await coach.DeleteAsync("/api/matchappearances/999999"), HttpStatusCode.NotFound);
    }
}
