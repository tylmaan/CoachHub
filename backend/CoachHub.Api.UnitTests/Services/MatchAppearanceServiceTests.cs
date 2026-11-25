using CoachHub.Api.Models;
using CoachHub.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace CoachHub.Api.UnitTests.Services;

public class MatchAppearanceServiceTests : IDisposable
{
    private readonly TestDb _db = new();
    private readonly MatchAppearanceService _sut;

    public MatchAppearanceServiceTests()
    {
        _sut = new MatchAppearanceService(_db.Context);
    }

    public void Dispose() => _db.Dispose();

    private async Task<(Team team, Match match, Player player)> SeedAsync()
    {
        var team = await _db.Context.AddTeamAsync();
        var match = await _db.Context.AddMatchAsync(team.Id);
        var player = await _db.Context.AddPlayerAsync(team.Id);
        return (team, match, player);
    }

    [Fact]
    public async Task CreateAsync_PersistsAppearance()
    {
        var (_, match, player) = await SeedAsync();

        var created = await _sut.CreateAsync(new MatchAppearance
        {
            MatchId = match.Id, PlayerId = player.Id, IsStarting = true, Position = "CM"
        });

        created.Id.Should().BeGreaterThan(0);
        var saved = await _db.NewContext().MatchAppearances.SingleAsync();
        saved.IsStarting.Should().BeTrue();
        saved.Position.Should().Be("CM");
    }

    [Fact]
    public async Task GetAllAsync_ReturnsAll()
    {
        var (_, match, player) = await SeedAsync();
        await _db.Context.AddAppearanceAsync(match.Id, player.Id);

        (await _sut.GetAllAsync()).Should().HaveCount(1);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsAppearanceOrNull()
    {
        var (_, match, player) = await SeedAsync();
        var appearance = await _db.Context.AddAppearanceAsync(match.Id, player.Id);

        (await _sut.GetByIdAsync(appearance.Id)).Should().NotBeNull();
        (await _sut.GetByIdAsync(404)).Should().BeNull();
    }

    [Fact]
    public async Task GetByMatchIdAsync_ReturnsOnlyAppearancesOfThatMatch()
    {
        var (team, match, player) = await SeedAsync();
        var otherMatch = await _db.Context.AddMatchAsync(team.Id);
        await _db.Context.AddAppearanceAsync(match.Id, player.Id);
        await _db.Context.AddAppearanceAsync(otherMatch.Id, player.Id);

        var result = await _sut.GetByMatchIdAsync(match.Id);

        result.Should().ContainSingle().Which.MatchId.Should().Be(match.Id);
    }

    [Fact]
    public async Task UpdateAsync_CopiesPlayerStartingFlagAndPosition_ButNotMatch()
    {
        var (team, match, player) = await SeedAsync();
        var otherMatch = await _db.Context.AddMatchAsync(team.Id);
        var otherPlayer = await _db.Context.AddPlayerAsync(team.Id, lastName: "Other");
        var appearance = await _db.Context.AddAppearanceAsync(match.Id, player.Id, isStarting: true, position: "GK");

        var ok = await _sut.UpdateAsync(appearance.Id, new MatchAppearance
        {
            MatchId = otherMatch.Id, PlayerId = otherPlayer.Id, IsStarting = false, Position = "ST"
        });

        ok.Should().BeTrue();
        var saved = await _db.NewContext().MatchAppearances.SingleAsync();
        saved.PlayerId.Should().Be(otherPlayer.Id);
        saved.IsStarting.Should().BeFalse();
        saved.Position.Should().Be("ST");
        saved.MatchId.Should().Be(match.Id);
    }

    [Fact]
    public async Task UpdateAsync_ReturnsFalse_WhenMissing()
    {
        (await _sut.UpdateAsync(404, new MatchAppearance())).Should().BeFalse();
    }

    [Fact]
    public async Task DeleteAsync_RemovesAppearance()
    {
        var (_, match, player) = await SeedAsync();
        var appearance = await _db.Context.AddAppearanceAsync(match.Id, player.Id);

        (await _sut.DeleteAsync(appearance.Id)).Should().BeTrue();
        (await _db.NewContext().MatchAppearances.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task DeleteAsync_ReturnsFalse_WhenMissing()
    {
        (await _sut.DeleteAsync(404)).Should().BeFalse();
    }
}
