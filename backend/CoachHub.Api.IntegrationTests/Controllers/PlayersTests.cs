using System.Net;
using System.Net.Http.Json;
using CoachHub.Api.Data;
using CoachHub.Api.DTOs;
using CoachHub.Api.Models;
using CoachHub.Api.UnitTests.Helpers;
using Microsoft.EntityFrameworkCore;

namespace CoachHub.Api.IntegrationTests.Controllers;

public class PlayersTests : ApiTestBase
{
    public PlayersTests(CoachHubFactory factory) : base(factory) { }

    private static object PlayerBody(int teamId, string firstName = "Adam", string lastName = "Nowak", object? archivedAt = null) => new
    {
        firstName,
        lastName,
        position = "Defender",
        dateOfBirth = "1999-04-12",
        nationality = "PL",
        heightCm = 185,
        jerseyNumber = 4,
        preferredFoot = "Right",
        teamId,
        archivedAt
    };

    // ---------- read ----------

    [Fact]
    public async Task GetAll_ReturnsOnlyPlayersOfTheCallersTeam_IncludingArchived()
    {
        var world = await NewWorldAsync();
        var archived = await Factory.WithDbAsync(db =>
            db.AddPlayerAsync(world.Team.Id, "Old", "Timer", archivedAt: new DateOnly(2025, 1, 1)));

        var players = await ReadAsync<List<Player>>(await world.As(world.Coach).GetAsync("/api/players"));

        players.Select(p => p.Id).Should().BeEquivalentTo(new[] { world.Player.Id, archived.Id });
        players.Should().NotContain(p => p.Id == world.OtherPlayer.Id);
    }

    [Fact]
    public async Task GetAll_ForStaffWithoutTeam_ReturnsEmptyList()
    {
        var world = await NewWorldAsync();
        var drifter = await Factory.CreateUserAsync(Roles.Coach, null);

        var players = await ReadAsync<List<Player>>(await world.As(drifter).GetAsync("/api/players"));

        players.Should().BeEmpty();
    }

    [Fact]
    public async Task GetById_ReturnsOwnPlayer_Forbids_Foreign_And404sMissing()
    {
        var world = await NewWorldAsync();
        var client = world.As(world.Analyst);

        var own = await client.GetAsync($"/api/players/{world.Player.Id}");
        ShouldBe(own, HttpStatusCode.OK);
        (await ReadAsync<Player>(own)).LastName.Should().Be("Kowalski");

        ShouldBe(await client.GetAsync($"/api/players/{world.OtherPlayer.Id}"), HttpStatusCode.Forbidden);
        ShouldBe(await client.GetAsync("/api/players/999999"), HttpStatusCode.NotFound);
    }

    // ---------- create ----------

    [Fact]
    public async Task Create_PersistsPlayerInCallersTeam()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Coach).PostAsJsonAsync("/api/players", PlayerBody(world.Team.Id));

        ShouldBe(response, HttpStatusCode.Created);
        response.Headers.Location.Should().NotBeNull();
        var created = await ReadAsync<Player>(response);
        var saved = await Factory.WithDbAsync(db => db.Players.SingleAsync(p => p.Id == created.Id));
        saved.FirstName.Should().Be("Adam");
        saved.TeamId.Should().Be(world.Team.Id);
        saved.JerseyNumber.Should().Be(4);
    }

    [Fact]
    public async Task Create_IsAllowedForAssistantCoach()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Assistant).PostAsJsonAsync("/api/players", PlayerBody(world.Team.Id));

        ShouldBe(response, HttpStatusCode.Created);
    }

    [Fact]
    public async Task Create_Forbids_AddingPlayerToForeignTeam()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Coach).PostAsJsonAsync("/api/players", PlayerBody(world.OtherTeam.Id));

        ShouldBe(response, HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Create_IgnoresArchivedAtSentByTheClient()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Coach)
            .PostAsJsonAsync("/api/players", PlayerBody(world.Team.Id, archivedAt: "2024-01-01"));

        ShouldBe(response, HttpStatusCode.Created);
        var created = await ReadAsync<Player>(response);
        created.ArchivedAt.Should().BeNull();
    }

    [Fact]
    public async Task Create_Returns400_WhenRequiredFieldsAreMissing()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Coach)
            .PostAsJsonAsync("/api/players", new { lastName = "NoFirstName", teamId = world.Team.Id });

        ShouldBe(response, HttpStatusCode.BadRequest);
    }

    // ---------- update ----------

    [Fact]
    public async Task Update_ChangesPlayerFields()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Coach).PutAsJsonAsync(
            $"/api/players/{world.Player.Id}", PlayerBody(world.Team.Id, "Zmieniony", "Zawodnik"));

        ShouldBe(response, HttpStatusCode.NoContent);
        var saved = await Factory.WithDbAsync(db => db.Players.SingleAsync(p => p.Id == world.Player.Id));
        saved.FirstName.Should().Be("Zmieniony");
        saved.LastName.Should().Be("Zawodnik");
        saved.Position.Should().Be("Defender");
    }

    [Fact]
    public async Task Update_DoesNotChangeArchiveState()
    {
        var world = await NewWorldAsync();

        await world.As(world.Coach).PutAsJsonAsync(
            $"/api/players/{world.Player.Id}", PlayerBody(world.Team.Id, archivedAt: "2024-01-01"));

        var saved = await Factory.WithDbAsync(db => db.Players.SingleAsync(p => p.Id == world.Player.Id));
        saved.ArchivedAt.Should().BeNull();
    }

    [Fact]
    public async Task Update_Forbids_MovingPlayerToAnotherTeam()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Coach).PutAsJsonAsync(
            $"/api/players/{world.Player.Id}", PlayerBody(world.OtherTeam.Id));

        ShouldBe(response, HttpStatusCode.Forbidden);
        var saved = await Factory.WithDbAsync(db => db.Players.SingleAsync(p => p.Id == world.Player.Id));
        saved.TeamId.Should().Be(world.Team.Id);
    }

    [Fact]
    public async Task Update_Forbids_EditingForeignPlayer()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Coach).PutAsJsonAsync(
            $"/api/players/{world.OtherPlayer.Id}", PlayerBody(world.Team.Id));

        ShouldBe(response, HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Update_Returns404_ForMissingPlayer()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Coach).PutAsJsonAsync("/api/players/999999", PlayerBody(world.Team.Id));

        ShouldBe(response, HttpStatusCode.NotFound);
    }

    // ---------- archive / restore / delete ----------

    [Fact]
    public async Task Archive_MarksPlayerArchived_AndRestoreClearsIt()
    {
        var world = await NewWorldAsync();
        var coach = world.As(world.Coach);

        ShouldBe(await coach.PostAsync($"/api/players/{world.Player.Id}/archive", null), HttpStatusCode.NoContent);
        var archived = await ReadAsync<Player>(await coach.GetAsync($"/api/players/{world.Player.Id}"));
        archived.ArchivedAt.Should().Be(DateOnly.FromDateTime(DateTime.Today));

        ShouldBe(await coach.PostAsync($"/api/players/{world.Player.Id}/restore", null), HttpStatusCode.NoContent);
        var restored = await ReadAsync<Player>(await coach.GetAsync($"/api/players/{world.Player.Id}"));
        restored.ArchivedAt.Should().BeNull();
    }

    [Fact]
    public async Task Delete_Returns409_ForPlayerThatIsNotArchived()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Coach).DeleteAsync($"/api/players/{world.Player.Id}");

        ShouldBe(response, HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Delete_Returns409_ForArchivedPlayerWithMatchData()
    {
        var world = await NewWorldAsync();
        var coach = world.As(world.Coach);
        await coach.PostAsync($"/api/players/{world.Player.Id}/archive", null);

        var response = await coach.DeleteAsync($"/api/players/{world.Player.Id}");

        ShouldBe(response, HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Delete_RemovesArchivedPlayerWithoutMatchData()
    {
        var world = await NewWorldAsync();
        var coach = world.As(world.Coach);
        var player = await Factory.WithDbAsync(db =>
            db.AddPlayerAsync(world.Team.Id, "To", "Delete", archivedAt: new DateOnly(2025, 1, 1)));

        ShouldBe(await coach.DeleteAsync($"/api/players/{player.Id}"), HttpStatusCode.NoContent);
        ShouldBe(await coach.GetAsync($"/api/players/{player.Id}"), HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Archive_Restore_Delete_AndImpact_ForbidForeignPlayers_And404ForMissing()
    {
        var world = await NewWorldAsync();
        var coach = world.As(world.Coach);

        foreach (var request in new[]
        {
            (HttpMethod.Post, $"/api/players/{world.OtherPlayer.Id}/archive"),
            (HttpMethod.Post, $"/api/players/{world.OtherPlayer.Id}/restore"),
            (HttpMethod.Delete, $"/api/players/{world.OtherPlayer.Id}"),
            (HttpMethod.Get, $"/api/players/{world.OtherPlayer.Id}/deletion-impact"),
        })
        {
            var response = await coach.SendAsync(new HttpRequestMessage(request.Item1, request.Item2));
            response.StatusCode.Should().Be(HttpStatusCode.Forbidden, $"{request.Item1} {request.Item2}");
        }

        foreach (var request in new[]
        {
            (HttpMethod.Post, "/api/players/999999/archive"),
            (HttpMethod.Post, "/api/players/999999/restore"),
            (HttpMethod.Delete, "/api/players/999999"),
            (HttpMethod.Get, "/api/players/999999/deletion-impact"),
        })
        {
            var response = await coach.SendAsync(new HttpRequestMessage(request.Item1, request.Item2));
            response.StatusCode.Should().Be(HttpStatusCode.NotFound, $"{request.Item1} {request.Item2}");
        }
    }

    [Fact]
    public async Task DeletionImpact_CountsAppearancesEventsAndReports()
    {
        var world = await NewWorldAsync();
        await Factory.WithDbAsync(db => db.AddReportAsync(world.Coach.Id, playerId: world.Player.Id));

        var response = await world.As(world.Coach).GetAsync($"/api/players/{world.Player.Id}/deletion-impact");

        ShouldBe(response, HttpStatusCode.OK);
        var impact = await ReadAsync<PlayerDeletionImpact>(response);
        impact.Appearances.Should().Be(1);
        impact.Events.Should().Be(1);
        impact.Reports.Should().Be(1);
    }
}
