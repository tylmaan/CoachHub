using CoachHub.Api.Models;
using CoachHub.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace CoachHub.Api.UnitTests.Services;

public class MatchServiceTests : IDisposable
{
    private readonly TestDb _db = new();
    private readonly IFileStorageService _files = Substitute.For<IFileStorageService>();
    private readonly MatchService _sut;

    public MatchServiceTests()
    {
        _sut = new MatchService(_db.Context, _files);
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task CreateAsync_PersistsMatchWithPlannedStatusByDefault()
    {
        var team = await _db.Context.AddTeamAsync();

        var created = await _sut.CreateAsync(new Match
        {
            TeamId = team.Id,
            Opponent = "Rival",
            Season = "2025/26",
            Date = new DateOnly(2025, 10, 1)
        });

        created.Id.Should().BeGreaterThan(0);
        (await _db.NewContext().Matches.SingleAsync()).Status.Should().Be("Planned");
    }

    [Fact]
    public async Task GetAllAsync_And_GetByIdAsync_ReturnPersistedMatches()
    {
        var team = await _db.Context.AddTeamAsync();
        var m1 = await _db.Context.AddMatchAsync(team.Id, opponent: "A");
        await _db.Context.AddMatchAsync(team.Id, opponent: "B");

        (await _sut.GetAllAsync()).Should().HaveCount(2);
        (await _sut.GetByIdAsync(m1.Id))!.Opponent.Should().Be("A");
        (await _sut.GetByIdAsync(404)).Should().BeNull();
    }

    [Fact]
    public async Task UpdateAsync_CopiesFields_ButKeepsNotes()
    {
        var team = await _db.Context.AddTeamAsync();
        var match = await _db.Context.AddMatchAsync(team.Id, status: "Planned", scoreFor: null, scoreAgainst: null);
        await _sut.UpdateNoteAsync(match.Id, nameof(Match.GamePlan), "Press high");
        await _sut.UpdateNoteAsync(match.Id, nameof(Match.OpponentNotes), "Slow defenders");

        var update = new Match
        {
            Date = new DateOnly(2025, 11, 2),
            Status = "Played",
            Opponent = "New Rival",
            Season = "2025/26",
            ScoreFor = 3,
            ScoreAgainst = 1,
            IsHome = true,
            MatchType = "League",
            Competition = "Ekstraklasa",
            Round = "12",
            Formation = "4-3-3",
            TeamId = team.Id
        };

        var ok = await _sut.UpdateAsync(match.Id, update);

        ok.Should().BeTrue();
        var saved = await _db.NewContext().Matches.SingleAsync();
        saved.Status.Should().Be("Played");
        saved.Opponent.Should().Be("New Rival");
        saved.ScoreFor.Should().Be(3);
        saved.ScoreAgainst.Should().Be(1);
        saved.IsHome.Should().BeTrue();
        saved.MatchType.Should().Be("League");
        saved.Competition.Should().Be("Ekstraklasa");
        saved.Round.Should().Be("12");
        saved.Formation.Should().Be("4-3-3");
        saved.Date.Should().Be(new DateOnly(2025, 11, 2));
        saved.GamePlan.Should().Be("Press high");
        saved.OpponentNotes.Should().Be("Slow defenders");
    }

    [Fact]
    public async Task UpdateAsync_ReturnsFalse_WhenMissing()
    {
        var update = new Match { Opponent = "X", Season = "S" };

        (await _sut.UpdateAsync(404, update)).Should().BeFalse();
    }

    [Fact]
    public async Task UpdateAsync_DeletesOldOpponentLogo_OnlyWhenChanged()
    {
        var team = await _db.Context.AddTeamAsync();
        var match = await _db.Context.AddMatchAsync(team.Id, opponentLogoUrl: "/uploads/old.png");

        await _sut.UpdateAsync(match.Id, new Match
        {
            Opponent = "X", Season = "S", OpponentLogoUrl = "/uploads/old.png"
        });
        _files.DidNotReceiveWithAnyArgs().DeleteFile(default);

        await _sut.UpdateAsync(match.Id, new Match
        {
            Opponent = "X", Season = "S", OpponentLogoUrl = null
        });
        _files.Received(1).DeleteFile("/uploads/old.png");
    }

    [Theory]
    [InlineData(nameof(Match.GamePlan))]
    [InlineData(nameof(Match.OpponentNotes))]
    public async Task UpdateNoteAsync_SetsTheRequestedField(string field)
    {
        var team = await _db.Context.AddTeamAsync();
        var match = await _db.Context.AddMatchAsync(team.Id);

        var ok = await _sut.UpdateNoteAsync(match.Id, field, "some note");

        ok.Should().BeTrue();
        var saved = await _db.NewContext().Matches.SingleAsync();
        (field == nameof(Match.GamePlan) ? saved.GamePlan : saved.OpponentNotes).Should().Be("some note");
        (field == nameof(Match.GamePlan) ? saved.OpponentNotes : saved.GamePlan).Should().BeNull();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task UpdateNoteAsync_StoresNull_ForBlankText(string? text)
    {
        var team = await _db.Context.AddTeamAsync();
        var match = await _db.Context.AddMatchAsync(team.Id);
        await _sut.UpdateNoteAsync(match.Id, nameof(Match.GamePlan), "something");

        await _sut.UpdateNoteAsync(match.Id, nameof(Match.GamePlan), text);

        (await _db.NewContext().Matches.SingleAsync()).GamePlan.Should().BeNull();
    }

    [Fact]
    public async Task UpdateNoteAsync_ThrowsForUnknownField()
    {
        var team = await _db.Context.AddTeamAsync();
        var match = await _db.Context.AddMatchAsync(team.Id);

        var act = () => _sut.UpdateNoteAsync(match.Id, "Opponent", "hack");

        await act.Should().ThrowAsync<ArgumentOutOfRangeException>();
    }

    [Fact]
    public async Task UpdateNoteAsync_ReturnsFalse_WhenMatchMissing()
    {
        (await _sut.UpdateNoteAsync(404, nameof(Match.GamePlan), "x")).Should().BeFalse();
    }

    [Fact]
    public async Task DeleteAsync_RemovesMatchAndItsDependentsAndDeletesLogo()
    {
        var team = await _db.Context.AddTeamAsync();
        var player = await _db.Context.AddPlayerAsync(team.Id);
        var match = await _db.Context.AddMatchAsync(team.Id, opponentLogoUrl: "/uploads/o.png");
        await _db.Context.AddAppearanceAsync(match.Id, player.Id);
        await _db.Context.AddEventAsync(match.Id, "Goal", player.Id, 10);

        var ok = await _sut.DeleteAsync(match.Id);

        ok.Should().BeTrue();
        var check = _db.NewContext();
        (await check.Matches.CountAsync()).Should().Be(0);
        (await check.MatchAppearances.CountAsync()).Should().Be(0);
        (await check.MatchEvents.CountAsync()).Should().Be(0);
        (await check.Players.CountAsync()).Should().Be(1);
        _files.Received(1).DeleteFile("/uploads/o.png");
    }

    [Fact]
    public async Task DeleteAsync_ReturnsFalse_WhenMissing()
    {
        (await _sut.DeleteAsync(404)).Should().BeFalse();
    }
}
