using System.Net;
using System.Net.Http.Json;
using CoachHub.Api.Models;
using CoachHub.Api.UnitTests.Helpers;
using Microsoft.EntityFrameworkCore;

namespace CoachHub.Api.IntegrationTests.Controllers;

public class MatchEventsTests : ApiTestBase
{
    public MatchEventsTests(CoachHubFactory factory) : base(factory) { }

    private static object Body(
        int matchId,
        string eventType = "Goal",
        string team = "Us",
        int? minute = 30,
        int? addedTime = null,
        int? playerId = null,
        string? opponentPlayerName = null) =>
        new { matchId, eventType, team, minute, addedTime, playerId, opponentPlayerName };

    // ---------- read ----------

    [Fact]
    public async Task GetByMatch_ReturnsEventsOfAnOwnMatch()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Analyst).GetAsync($"/api/matchevents/match/{world.PlayedMatch.Id}");

        ShouldBe(response, HttpStatusCode.OK);
        var events = await ReadAsync<List<MatchEvent>>(response);
        events.Should().ContainSingle().Which.EventType.Should().Be("Goal");
    }

    [Fact]
    public async Task GetByMatch_Forbids_ForeignOrMissingMatch()
    {
        var world = await NewWorldAsync();
        var coach = world.As(world.Coach);

        ShouldBe(await coach.GetAsync($"/api/matchevents/match/{world.OtherMatch.Id}"), HttpStatusCode.Forbidden);
        ShouldBe(await coach.GetAsync("/api/matchevents/match/999999"), HttpStatusCode.Forbidden);
    }

    // ---------- create ----------

    [Fact]
    public async Task Create_PersistsEvent()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Assistant).PostAsJsonAsync(
            "/api/matchevents", Body(world.PlayedMatch.Id, "YellowCard", "Us", 55, playerId: world.Player.Id));

        ShouldBe(response, HttpStatusCode.Created);
        var created = await ReadAsync<MatchEvent>(response);
        var saved = await Factory.WithDbAsync(db => db.MatchEvents.SingleAsync(e => e.Id == created.Id));
        saved.EventType.Should().Be("YellowCard");
        saved.Minute.Should().Be(55);
        saved.PlayerId.Should().Be(world.Player.Id);
    }

    [Fact]
    public async Task Create_SupportsOpponentEventsWithAName()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Coach).PostAsJsonAsync(
            "/api/matchevents", Body(world.PlayedMatch.Id, "Goal", "Opponent", 12, opponentPlayerName: "Kowal"));

        ShouldBe(response, HttpStatusCode.Created);
        (await ReadAsync<MatchEvent>(response)).OpponentPlayerName.Should().Be("Kowal");
    }

    [Theory]
    [InlineData(45)]
    [InlineData(90)]
    [InlineData(105)]
    [InlineData(120)]
    public async Task Create_AcceptsAddedTime_OnStoppageMinutes(int minute)
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Coach).PostAsJsonAsync(
            "/api/matchevents", Body(world.PlayedMatch.Id, minute: minute, addedTime: 3));

        ShouldBe(response, HttpStatusCode.Created);
    }

    [Theory]
    [InlineData(44)]
    [InlineData(46)]
    [InlineData(1)]
    [InlineData(89)]
    [InlineData(null)]
    public async Task Create_Returns400_ForAddedTime_OnOtherMinutes(int? minute)
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Coach).PostAsJsonAsync(
            "/api/matchevents", Body(world.PlayedMatch.Id, minute: minute, addedTime: 2));

        ShouldBe(response, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Create_Forbids_ForeignOrMissingMatch()
    {
        var world = await NewWorldAsync();
        var coach = world.As(world.Coach);

        ShouldBe(await coach.PostAsJsonAsync("/api/matchevents", Body(world.OtherMatch.Id)), HttpStatusCode.Forbidden);
        ShouldBe(await coach.PostAsJsonAsync("/api/matchevents", Body(999_999)), HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Create_Returns400_WhenEventTypeIsMissing()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Coach)
            .PostAsJsonAsync("/api/matchevents", new { matchId = world.PlayedMatch.Id, team = "Us" });

        ShouldBe(response, HttpStatusCode.BadRequest);
    }

    // ---------- update ----------

    [Fact]
    public async Task Update_ChangesEventFields_ButNotTheMatch()
    {
        var world = await NewWorldAsync();
        var teammate = await Factory.WithDbAsync(db => db.AddPlayerAsync(world.Team.Id, "Strzelec", "Nowy"));

        var response = await world.As(world.Coach).PutAsJsonAsync(
            $"/api/matchevents/{world.Event.Id}",
            Body(world.OtherMatch.Id, "Assist", "Us", 44, playerId: teammate.Id));

        ShouldBe(response, HttpStatusCode.NoContent);
        var saved = await Factory.WithDbAsync(db => db.MatchEvents.SingleAsync(e => e.Id == world.Event.Id));
        saved.EventType.Should().Be("Assist");
        saved.Minute.Should().Be(44);
        saved.PlayerId.Should().Be(teammate.Id);
        saved.MatchId.Should().Be(world.PlayedMatch.Id);
    }

    [Fact]
    public async Task Update_Returns400_ForInvalidAddedTime()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Coach).PutAsJsonAsync(
            $"/api/matchevents/{world.Event.Id}", Body(world.PlayedMatch.Id, minute: 30, addedTime: 2));

        ShouldBe(response, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Update_Forbids_ForeignEvent_And404sMissing()
    {
        var world = await NewWorldAsync();
        var foreign = await Factory.WithDbAsync(db => db.AddEventAsync(world.OtherMatch.Id, "Goal", null, 5));
        var coach = world.As(world.Coach);

        ShouldBe(await coach.PutAsJsonAsync($"/api/matchevents/{foreign.Id}", Body(world.OtherMatch.Id)),
            HttpStatusCode.Forbidden);
        ShouldBe(await coach.PutAsJsonAsync("/api/matchevents/999999", Body(world.PlayedMatch.Id)),
            HttpStatusCode.NotFound);
    }

    // ---------- delete ----------

    [Fact]
    public async Task Delete_RemovesEvent()
    {
        var world = await NewWorldAsync();

        ShouldBe(await world.As(world.Coach).DeleteAsync($"/api/matchevents/{world.Event.Id}"), HttpStatusCode.NoContent);

        var exists = await Factory.WithDbAsync(db => db.MatchEvents.AnyAsync(e => e.Id == world.Event.Id));
        exists.Should().BeFalse();
    }

    [Fact]
    public async Task Delete_Forbids_ForeignEvent_And404sMissing()
    {
        var world = await NewWorldAsync();
        var foreign = await Factory.WithDbAsync(db => db.AddEventAsync(world.OtherMatch.Id, "Goal", null, 5));
        var coach = world.As(world.Coach);

        ShouldBe(await coach.DeleteAsync($"/api/matchevents/{foreign.Id}"), HttpStatusCode.Forbidden);
        ShouldBe(await coach.DeleteAsync("/api/matchevents/999999"), HttpStatusCode.NotFound);
    }
}
