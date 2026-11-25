using CoachHub.Api.Models;
using CoachHub.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace CoachHub.Api.UnitTests.Services;

public class PlayerServiceTests : IDisposable
{
    private readonly TestDb _db = new();
    private readonly IFileStorageService _files = Substitute.For<IFileStorageService>();
    private readonly PlayerService _sut;

    public PlayerServiceTests()
    {
        _sut = new PlayerService(_db.Context, _files);
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task GetAllAsync_ReturnsEveryPlayer()
    {
        var team = await _db.Context.AddTeamAsync();
        await _db.Context.AddPlayerAsync(team.Id, lastName: "A");
        await _db.Context.AddPlayerAsync(team.Id, lastName: "B");

        var result = await _sut.GetAllAsync();

        result.Select(p => p.LastName).Should().BeEquivalentTo("A", "B");
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsPlayer_WhenExists()
    {
        var team = await _db.Context.AddTeamAsync();
        var player = await _db.Context.AddPlayerAsync(team.Id, "Piotr", "Nowak");

        var result = await _sut.GetByIdAsync(player.Id);

        result.Should().NotBeNull();
        result!.FirstName.Should().Be("Piotr");
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsNull_WhenMissing()
    {
        (await _sut.GetByIdAsync(999)).Should().BeNull();
    }

    [Fact]
    public async Task CreateAsync_PersistsPlayerAndAssignsId()
    {
        var team = await _db.Context.AddTeamAsync();
        var player = new Player
        {
            FirstName = "Adam",
            LastName = "Lis",
            Position = "Goalkeeper",
            TeamId = team.Id,
            DateOfBirth = new DateOnly(1999, 5, 5)
        };

        var created = await _sut.CreateAsync(player);

        created.Id.Should().BeGreaterThan(0);
        (await _db.NewContext().Players.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task UpdateAsync_CopiesAllEditableFields()
    {
        var team = await _db.Context.AddTeamAsync();
        var otherTeam = await _db.Context.AddTeamAsync("Other");
        var player = await _db.Context.AddPlayerAsync(team.Id);

        var update = new Player
        {
            FirstName = "Marek",
            LastName = "Zielinski",
            Nationality = "PL",
            DateOfBirth = new DateOnly(1995, 3, 12),
            Position = "Defender",
            HeightCm = 188,
            JerseyNumber = 4,
            PreferredFoot = "Left",
            TeamId = otherTeam.Id,
            PhotoUrl = "/uploads/new.png"
        };

        var ok = await _sut.UpdateAsync(player.Id, update);

        ok.Should().BeTrue();
        var saved = await _db.NewContext().Players.SingleAsync();
        saved.FirstName.Should().Be("Marek");
        saved.LastName.Should().Be("Zielinski");
        saved.Nationality.Should().Be("PL");
        saved.DateOfBirth.Should().Be(new DateOnly(1995, 3, 12));
        saved.Position.Should().Be("Defender");
        saved.HeightCm.Should().Be(188);
        saved.JerseyNumber.Should().Be(4);
        saved.PreferredFoot.Should().Be("Left");
        saved.TeamId.Should().Be(otherTeam.Id);
        saved.PhotoUrl.Should().Be("/uploads/new.png");
    }

    [Fact]
    public async Task UpdateAsync_ReturnsFalse_WhenMissing()
    {
        var team = await _db.Context.AddTeamAsync();
        var update = new Player { FirstName = "X", LastName = "Y", Position = "Z", TeamId = team.Id };

        (await _sut.UpdateAsync(404, update)).Should().BeFalse();
        _files.DidNotReceiveWithAnyArgs().DeleteFile(default);
    }

    [Fact]
    public async Task UpdateAsync_DeletesOldPhoto_WhenPhotoChanged()
    {
        var team = await _db.Context.AddTeamAsync();
        var player = await _db.Context.AddPlayerAsync(team.Id, photoUrl: "/uploads/old.png");

        await _sut.UpdateAsync(player.Id, new Player
        {
            FirstName = "A", LastName = "B", Position = "C", TeamId = team.Id, PhotoUrl = "/uploads/new.png"
        });

        _files.Received(1).DeleteFile("/uploads/old.png");
    }

    [Fact]
    public async Task UpdateAsync_KeepsPhotoFile_WhenPhotoUnchanged()
    {
        var team = await _db.Context.AddTeamAsync();
        var player = await _db.Context.AddPlayerAsync(team.Id, photoUrl: "/uploads/same.png");

        await _sut.UpdateAsync(player.Id, new Player
        {
            FirstName = "A", LastName = "B", Position = "C", TeamId = team.Id, PhotoUrl = "/uploads/same.png"
        });

        _files.DidNotReceiveWithAnyArgs().DeleteFile(default);
    }

    [Fact]
    public async Task DeleteAsync_ReturnsNotFound_WhenMissing()
    {
        (await _sut.DeleteAsync(404)).Should().Be(DeletePlayerResult.NotFound);
    }

    [Fact]
    public async Task DeleteAsync_ReturnsNotArchived_WhenPlayerIsActive()
    {
        var team = await _db.Context.AddTeamAsync();
        var player = await _db.Context.AddPlayerAsync(team.Id);

        var result = await _sut.DeleteAsync(player.Id);

        result.Should().Be(DeletePlayerResult.NotArchived);
        (await _db.NewContext().Players.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task DeleteAsync_ReturnsHasMatchData_WhenPlayerHasAppearance()
    {
        var team = await _db.Context.AddTeamAsync();
        var player = await _db.Context.AddPlayerAsync(team.Id, archivedAt: new DateOnly(2025, 1, 1));
        var match = await _db.Context.AddMatchAsync(team.Id);
        await _db.Context.AddAppearanceAsync(match.Id, player.Id);

        var result = await _sut.DeleteAsync(player.Id);

        result.Should().Be(DeletePlayerResult.HasMatchData);
        (await _db.NewContext().Players.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task DeleteAsync_ReturnsHasMatchData_WhenPlayerHasEvent()
    {
        var team = await _db.Context.AddTeamAsync();
        var player = await _db.Context.AddPlayerAsync(team.Id, archivedAt: new DateOnly(2025, 1, 1));
        var match = await _db.Context.AddMatchAsync(team.Id);
        await _db.Context.AddEventAsync(match.Id, "Goal", player.Id, 10);

        var result = await _sut.DeleteAsync(player.Id);

        result.Should().Be(DeletePlayerResult.HasMatchData);
    }

    [Fact]
    public async Task DeleteAsync_RemovesArchivedPlayerWithoutMatchDataAndDeletesPhoto()
    {
        var team = await _db.Context.AddTeamAsync();
        var player = await _db.Context.AddPlayerAsync(
            team.Id, archivedAt: new DateOnly(2025, 1, 1), photoUrl: "/uploads/p.png");

        var result = await _sut.DeleteAsync(player.Id);

        result.Should().Be(DeletePlayerResult.Deleted);
        (await _db.NewContext().Players.CountAsync()).Should().Be(0);
        _files.Received(1).DeleteFile("/uploads/p.png");
    }

    [Fact]
    public async Task DeleteAsync_CascadesToReportsOfThePlayer()
    {
        var team = await _db.Context.AddTeamAsync();
        await _db.Context.AddUserAsync("u1");
        var player = await _db.Context.AddPlayerAsync(team.Id, archivedAt: new DateOnly(2025, 1, 1));
        await _db.Context.AddReportAsync("u1", playerId: player.Id);

        await _sut.DeleteAsync(player.Id);

        (await _db.NewContext().Reports.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task ArchiveAsync_SetsArchivedAtToToday()
    {
        var team = await _db.Context.AddTeamAsync();
        var player = await _db.Context.AddPlayerAsync(team.Id);

        var ok = await _sut.ArchiveAsync(player.Id);

        ok.Should().BeTrue();
        var saved = await _db.NewContext().Players.SingleAsync();
        saved.ArchivedAt.Should().Be(DateOnly.FromDateTime(DateTime.Today));
    }

    [Fact]
    public async Task ArchiveAsync_DoesNotOverwriteExistingArchiveDate()
    {
        var team = await _db.Context.AddTeamAsync();
        var original = new DateOnly(2024, 6, 1);
        var player = await _db.Context.AddPlayerAsync(team.Id, archivedAt: original);

        await _sut.ArchiveAsync(player.Id);

        (await _db.NewContext().Players.SingleAsync()).ArchivedAt.Should().Be(original);
    }

    [Fact]
    public async Task ArchiveAsync_ReturnsFalse_WhenMissing()
    {
        (await _sut.ArchiveAsync(404)).Should().BeFalse();
    }

    [Fact]
    public async Task RestoreAsync_ClearsArchiveDate()
    {
        var team = await _db.Context.AddTeamAsync();
        var player = await _db.Context.AddPlayerAsync(team.Id, archivedAt: new DateOnly(2025, 1, 1));

        var ok = await _sut.RestoreAsync(player.Id);

        ok.Should().BeTrue();
        (await _db.NewContext().Players.SingleAsync()).ArchivedAt.Should().BeNull();
    }

    [Fact]
    public async Task RestoreAsync_ReturnsFalse_WhenMissing()
    {
        (await _sut.RestoreAsync(404)).Should().BeFalse();
    }

    [Fact]
    public async Task GetDeletionImpactAsync_ReturnsNull_WhenPlayerMissing()
    {
        (await _sut.GetDeletionImpactAsync(404)).Should().BeNull();
    }

    [Fact]
    public async Task GetDeletionImpactAsync_CountsAppearancesEventsAndReports()
    {
        var team = await _db.Context.AddTeamAsync();
        await _db.Context.AddUserAsync("u1");
        var player = await _db.Context.AddPlayerAsync(team.Id);
        var other = await _db.Context.AddPlayerAsync(team.Id, lastName: "Other");
        var m1 = await _db.Context.AddMatchAsync(team.Id);
        var m2 = await _db.Context.AddMatchAsync(team.Id);
        await _db.Context.AddAppearanceAsync(m1.Id, player.Id);
        await _db.Context.AddAppearanceAsync(m2.Id, player.Id);
        await _db.Context.AddAppearanceAsync(m1.Id, other.Id);
        await _db.Context.AddEventAsync(m1.Id, "Goal", player.Id, 5);
        await _db.Context.AddReportAsync("u1", playerId: player.Id);
        await _db.Context.AddReportAsync("u1", playerId: player.Id);
        await _db.Context.AddReportAsync("u1", playerId: other.Id);

        var impact = await _sut.GetDeletionImpactAsync(player.Id);

        impact.Should().NotBeNull();
        impact!.Appearances.Should().Be(2);
        impact.Events.Should().Be(1);
        impact.Reports.Should().Be(2);
    }
}
