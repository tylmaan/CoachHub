using CoachHub.Api.Models;
using CoachHub.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace CoachHub.Api.UnitTests.Services;

public class TeamServiceTests : IDisposable
{
    private readonly TestDb _db = new();
    private readonly IFileStorageService _files = Substitute.For<IFileStorageService>();
    private readonly TeamService _sut;

    public TeamServiceTests()
    {
        _sut = new TeamService(_db.Context, _files);
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task CreateAsync_PersistsTeamWithDefaultKits()
    {
        var created = await _sut.CreateAsync(new Team { Name = "Lions" });

        created.Id.Should().BeGreaterThan(0);
        var saved = await _db.NewContext().Teams.SingleAsync();
        saved.Name.Should().Be("Lions");
        saved.HomeKit.PrimaryColor.Should().Be("#7c3aed");
        saved.AwayKit.SecondaryColor.Should().Be("#7c3aed");
        saved.GoalkeeperKit.PrimaryColor.Should().Be("#16a34a");
    }

    [Fact]
    public async Task GetAllAsync_ReturnsAllTeams()
    {
        await _db.Context.AddTeamAsync("A");
        await _db.Context.AddTeamAsync("B");

        (await _sut.GetAllAsync()).Select(t => t.Name).Should().BeEquivalentTo("A", "B");
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsTeamOrNull()
    {
        var team = await _db.Context.AddTeamAsync("A");

        (await _sut.GetByIdAsync(team.Id))!.Name.Should().Be("A");
        (await _sut.GetByIdAsync(404)).Should().BeNull();
    }

    [Fact]
    public async Task UpdateAsync_CopiesFieldsIncludingKits()
    {
        var team = await _db.Context.AddTeamAsync("Old");

        var update = new Team
        {
            Name = "New",
            CountryCode = "PL",
            League = "Ekstraklasa",
            LogoUrl = "/uploads/logo.png",
            HomeKit = new Kit { Pattern = "Stripes", PrimaryColor = "#111111", SecondaryColor = "#222222" },
            AwayKit = new Kit { Pattern = "Solid", PrimaryColor = "#333333", SecondaryColor = "#444444" },
            GoalkeeperKit = new Kit { Pattern = "Hoops", PrimaryColor = "#555555", SecondaryColor = "#666666" }
        };

        var ok = await _sut.UpdateAsync(team.Id, update);

        ok.Should().BeTrue();
        var saved = await _db.NewContext().Teams.SingleAsync();
        saved.Name.Should().Be("New");
        saved.CountryCode.Should().Be("PL");
        saved.League.Should().Be("Ekstraklasa");
        saved.LogoUrl.Should().Be("/uploads/logo.png");
        saved.HomeKit.Pattern.Should().Be("Stripes");
        saved.HomeKit.PrimaryColor.Should().Be("#111111");
        saved.AwayKit.SecondaryColor.Should().Be("#444444");
        saved.GoalkeeperKit.Pattern.Should().Be("Hoops");
    }

    [Fact]
    public async Task UpdateAsync_ReturnsFalse_WhenMissing()
    {
        (await _sut.UpdateAsync(404, new Team { Name = "X" })).Should().BeFalse();
    }

    [Fact]
    public async Task UpdateAsync_DeletesOldLogo_OnlyWhenLogoChanged()
    {
        var team = await _db.Context.AddTeamAsync("T", logoUrl: "/uploads/old.png");

        await _sut.UpdateAsync(team.Id, new Team { Name = "T", LogoUrl = "/uploads/old.png" });
        _files.DidNotReceiveWithAnyArgs().DeleteFile(default);

        await _sut.UpdateAsync(team.Id, new Team { Name = "T", LogoUrl = "/uploads/new.png" });
        _files.Received(1).DeleteFile("/uploads/old.png");
    }

    [Fact]
    public async Task DeleteAsync_RemovesTeamAndDeletesLogo()
    {
        var team = await _db.Context.AddTeamAsync("T", logoUrl: "/uploads/logo.png");

        var ok = await _sut.DeleteAsync(team.Id);

        ok.Should().BeTrue();
        (await _db.NewContext().Teams.CountAsync()).Should().Be(0);
        _files.Received(1).DeleteFile("/uploads/logo.png");
    }

    [Fact]
    public async Task DeleteAsync_ReturnsFalse_WhenMissing()
    {
        (await _sut.DeleteAsync(404)).Should().BeFalse();
        _files.DidNotReceiveWithAnyArgs().DeleteFile(default);
    }

    [Fact]
    public async Task DeleteAsync_CascadesToPlayersAndMatches()
    {
        var team = await _db.Context.AddTeamAsync();
        await _db.Context.AddPlayerAsync(team.Id);
        await _db.Context.AddMatchAsync(team.Id);

        await _sut.DeleteAsync(team.Id);

        var check = _db.NewContext();
        (await check.Players.CountAsync()).Should().Be(0);
        (await check.Matches.CountAsync()).Should().Be(0);
    }
}
