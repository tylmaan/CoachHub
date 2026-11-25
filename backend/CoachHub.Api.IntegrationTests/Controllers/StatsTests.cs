using System.Net;
using CoachHub.Api.Data;
using CoachHub.Api.DTOs;
using CoachHub.Api.UnitTests.Helpers;

namespace CoachHub.Api.IntegrationTests.Controllers;

public class StatsTests : ApiTestBase
{
    public StatsTests(CoachHubFactory factory) : base(factory) { }

    [Fact]
    public async Task PlayerStats_AggregateTheCallersTeamOnly()
    {
        var world = await NewWorldAsync();
        await Factory.WithDbAsync(async db =>
        {
            await db.AddAppearanceAsync(world.OtherMatch.Id, world.OtherPlayer.Id);
            await db.AddEventAsync(world.OtherMatch.Id, "Goal", world.OtherPlayer.Id, 10);
        });

        var response = await world.As(world.Analyst).GetAsync("/api/playerstats");

        ShouldBe(response, HttpStatusCode.OK);
        var stats = await ReadAsync<List<PlayerSeasonStats>>(response);
        var row = stats.Should().ContainSingle().Subject;
        row.PlayerId.Should().Be(world.Player.Id);
        row.Season.Should().Be("2025/26");
        row.Matches.Should().Be(1);
        row.Minutes.Should().Be(90);
        row.Goals.Should().Be(1);
    }

    [Fact]
    public async Task PlayerStats_ForStaffWithoutTeam_AreEmpty()
    {
        var world = await NewWorldAsync();
        var drifter = await Factory.CreateUserAsync(Roles.Coach, null);

        var stats = await ReadAsync<List<PlayerSeasonStats>>(await world.As(drifter).GetAsync("/api/playerstats"));

        stats.Should().BeEmpty();
    }

    [Fact]
    public async Task TeamStats_AggregateTheCallersTeamOnly()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Coach).GetAsync("/api/teamstats");

        ShouldBe(response, HttpStatusCode.OK);
        var stats = await ReadAsync<List<TeamSeasonStats>>(response);
        var season = stats.Should().ContainSingle().Subject;
        season.Season.Should().Be("2025/26");
        season.Results.Should().ContainSingle().Which.MatchId.Should().Be(world.PlayedMatch.Id);
        season.Results[0].ScoreFor.Should().Be(2);
        season.Results[0].ScoreAgainst.Should().Be(1);
        season.GoalsScoredByPeriod.Should().Equal(0, 1, 0, 0, 0, 0, 0);
    }

    [Fact]
    public async Task TeamStats_ForStaffWithoutTeam_AreEmpty()
    {
        var world = await NewWorldAsync();
        var drifter = await Factory.CreateUserAsync(Roles.Analyst, null);

        var stats = await ReadAsync<List<TeamSeasonStats>>(await world.As(drifter).GetAsync("/api/teamstats"));

        stats.Should().BeEmpty();
    }
}
