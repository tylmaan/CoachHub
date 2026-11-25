using CoachHub.Api.DTOs;
using CoachHub.Api.Models;
using CoachHub.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace CoachHub.Api.UnitTests.Services;

public class ReportServiceTests : IDisposable
{
    private readonly TestDb _db = new();
    private readonly ReportService _sut;

    private Team _team = null!;
    private Team _otherTeam = null!;
    private Player _player = null!;
    private Player _otherPlayer = null!;
    private Match _match = null!;

    public ReportServiceTests()
    {
        _sut = new ReportService(_db.Context);
    }

    public void Dispose() => _db.Dispose();

    private async Task SeedBaseAsync()
    {
        _team = await _db.Context.AddTeamAsync("City");
        _otherTeam = await _db.Context.AddTeamAsync("United");
        _player = await _db.Context.AddPlayerAsync(_team.Id, "Jan", "Kowalski");
        _otherPlayer = await _db.Context.AddPlayerAsync(_otherTeam.Id, "Obcy", "Zawodnik");
        _match = await _db.Context.AddMatchAsync(_team.Id, opponent: "Rival FC", date: new DateOnly(2025, 9, 20));
        await _db.Context.AddUserAsync("anna", fullName: "Anna Kowalska", email: "anna@x.pl");
        await _db.Context.AddUserAsync("bob", fullName: null, email: "bob@x.pl");
    }

    // ---------- CRUD ----------

    [Fact]
    public async Task CreateReportAsync_PersistsReport()
    {
        await SeedBaseAsync();

        var created = await _sut.CreateReportAsync(new Report
        {
            Title = "T", Content = "C", CreatedByUserId = "anna", PlayerId = _player.Id
        });

        created.Id.Should().BeGreaterThan(0);
        (await _db.NewContext().Reports.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task GetReportByIdAsync_IncludesPlayerAndTeam()
    {
        await SeedBaseAsync();
        var report = await _db.Context.AddReportAsync("anna", playerId: _player.Id, teamId: _team.Id);

        var result = await _sut.GetReportByIdAsync(report.Id);

        result.Should().NotBeNull();
        result!.Player!.LastName.Should().Be("Kowalski");
        result.Team!.Name.Should().Be("City");
    }

    [Fact]
    public async Task GetReportByIdAsync_ReturnsNull_WhenMissing()
    {
        (await _sut.GetReportByIdAsync(404)).Should().BeNull();
    }

    [Fact]
    public async Task GetReportsByPlayerIdAsync_ReturnsOnlyThatPlayersReports()
    {
        await SeedBaseAsync();
        await _db.Context.AddReportAsync("anna", "mine", playerId: _player.Id);
        await _db.Context.AddReportAsync("anna", "other", playerId: _otherPlayer.Id);

        var result = await _sut.GetReportsByPlayerIdAsync(_player.Id);

        result.Should().ContainSingle().Which.Title.Should().Be("mine");
    }

    [Fact]
    public async Task GetReportsByTeamIdAsync_ReturnsOnlyReportsAttachedToTeam()
    {
        await SeedBaseAsync();
        await _db.Context.AddReportAsync("anna", "team", teamId: _team.Id);
        await _db.Context.AddReportAsync("anna", "player only", playerId: _player.Id);
        await _db.Context.AddReportAsync("anna", "other team", teamId: _otherTeam.Id);

        var result = await _sut.GetReportsByTeamIdAsync(_team.Id);

        result.Should().ContainSingle().Which.Title.Should().Be("team");
    }

    [Fact]
    public async Task GetReportsByUserIdAsync_ReturnsOnlyReportsWrittenByUser()
    {
        await SeedBaseAsync();
        await _db.Context.AddReportAsync("anna", "a", teamId: _team.Id);
        await _db.Context.AddReportAsync("bob", "b", teamId: _team.Id);

        var result = await _sut.GetReportsByUserIdAsync("anna");

        result.Should().ContainSingle().Which.Title.Should().Be("a");
    }

    [Fact]
    public async Task UpdateReportAsync_CopiesFields_ButKeepsAuthorAndCreationDate()
    {
        await SeedBaseAsync();
        var created = DateTime.UtcNow.AddDays(-3);
        var report = await _db.Context.AddReportAsync("anna", "Old", "Old content", "Normal",
            playerId: _player.Id, createdAt: created);

        var ok = await _sut.UpdateReportAsync(report.Id, new Report
        {
            Title = "New",
            Content = "New content",
            Priority = "High",
            TeamId = _team.Id,
            MatchId = _match.Id,
            CreatedByUserId = "bob"
        });

        ok.Should().BeTrue();
        var saved = await _db.NewContext().Reports.SingleAsync();
        saved.Title.Should().Be("New");
        saved.Content.Should().Be("New content");
        saved.Priority.Should().Be("High");
        saved.PlayerId.Should().BeNull();
        saved.TeamId.Should().Be(_team.Id);
        saved.MatchId.Should().Be(_match.Id);
        saved.CreatedByUserId.Should().Be("anna");
        saved.CreatedAt.Should().BeCloseTo(created, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public async Task UpdateReportAsync_ReturnsFalse_WhenMissing()
    {
        var update = new Report { Title = "t", Content = "c", CreatedByUserId = "x" };

        (await _sut.UpdateReportAsync(404, update)).Should().BeFalse();
    }

    [Fact]
    public async Task DeleteReportAsync_RemovesReportAndItsReadMarks()
    {
        await SeedBaseAsync();
        var report = await _db.Context.AddReportAsync("anna", teamId: _team.Id);
        await _sut.MarkAsReadAsync(report.Id, "bob");

        (await _sut.DeleteReportAsync(report.Id)).Should().BeTrue();

        var check = _db.NewContext();
        (await check.Reports.CountAsync()).Should().Be(0);
        (await check.ReportReads.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task DeleteReportAsync_ReturnsFalse_WhenMissing()
    {
        (await _sut.DeleteReportAsync(404)).Should().BeFalse();
    }

    // ---------- IsInTeam ----------

    [Fact]
    public async Task IsInTeamAsync_TrueForReportAttachedDirectlyToTeam()
    {
        await SeedBaseAsync();
        var report = await _db.Context.AddReportAsync("anna", teamId: _team.Id);

        (await _sut.IsInTeamAsync(report.Id, _team.Id)).Should().BeTrue();
        (await _sut.IsInTeamAsync(report.Id, _otherTeam.Id)).Should().BeFalse();
    }

    [Fact]
    public async Task IsInTeamAsync_TrueForReportAboutPlayerOfTeam()
    {
        await SeedBaseAsync();
        var report = await _db.Context.AddReportAsync("anna", playerId: _player.Id);

        (await _sut.IsInTeamAsync(report.Id, _team.Id)).Should().BeTrue();
        (await _sut.IsInTeamAsync(report.Id, _otherTeam.Id)).Should().BeFalse();
    }

    [Fact]
    public async Task IsInTeamAsync_FalseWhenReportMissing()
    {
        await SeedBaseAsync();

        (await _sut.IsInTeamAsync(404, _team.Id)).Should().BeFalse();
    }

    // ---------- Summary / read state ----------

    [Fact]
    public async Task GetSummaryByIdAsync_MapsRelatedData()
    {
        await SeedBaseAsync();
        var report = await _db.Context.AddReportAsync("anna", "Title", "Body", "High",
            playerId: _player.Id, teamId: _team.Id, matchId: _match.Id);

        var summary = await _sut.GetSummaryByIdAsync(report.Id, "bob");

        summary.Should().NotBeNull();
        summary!.Title.Should().Be("Title");
        summary.Content.Should().Be("Body");
        summary.Priority.Should().Be("High");
        summary.PlayerId.Should().Be(_player.Id);
        summary.PlayerName.Should().Be("Jan Kowalski");
        summary.TeamName.Should().Be("City");
        summary.MatchOpponent.Should().Be("Rival FC");
        summary.MatchDate.Should().Be(new DateOnly(2025, 9, 20));
        summary.AuthorId.Should().Be("anna");
        summary.AuthorName.Should().Be("Anna Kowalska");
    }

    [Fact]
    public async Task GetSummaryByIdAsync_ReturnsNull_WhenMissing()
    {
        (await _sut.GetSummaryByIdAsync(404, "anna")).Should().BeNull();
    }

    [Fact]
    public async Task GetSummaryByIdAsync_LeavesRelatedFieldsNull_ForStandaloneReport()
    {
        await SeedBaseAsync();
        var report = await _db.Context.AddReportAsync("anna");

        var summary = await _sut.GetSummaryByIdAsync(report.Id, "anna");

        summary!.PlayerName.Should().BeNull();
        summary.TeamName.Should().BeNull();
        summary.MatchOpponent.Should().BeNull();
        summary.MatchDate.Should().BeNull();
    }

    [Fact]
    public async Task GetSummaryByIdAsync_AuthorNameFallsBackToEmail_WhenNoFullName()
    {
        await SeedBaseAsync();
        var report = await _db.Context.AddReportAsync("bob");

        var summary = await _sut.GetSummaryByIdAsync(report.Id, "anna");

        summary!.AuthorName.Should().Be("bob@x.pl");
    }

    [Fact]
    public async Task GetSummaryByIdAsync_AuthorNameFallsBackToUserId_WhenNoFullNameAndNoEmail()
    {
        await SeedBaseAsync();
        await _db.Context.AddUserAsync("ghost");
        var report = await _db.Context.AddReportAsync("ghost");

        var summary = await _sut.GetSummaryByIdAsync(report.Id, "anna");

        summary!.AuthorName.Should().Be("ghost");
    }

    [Fact]
    public async Task IsRead_IsTrueForAuthor_FalseForOthers_TrueAfterMarkAsRead()
    {
        await SeedBaseAsync();
        var report = await _db.Context.AddReportAsync("anna", teamId: _team.Id);

        (await _sut.GetSummaryByIdAsync(report.Id, "anna"))!.IsRead.Should().BeTrue();
        (await _sut.GetSummaryByIdAsync(report.Id, "bob"))!.IsRead.Should().BeFalse();

        await _sut.MarkAsReadAsync(report.Id, "bob");

        (await _sut.GetSummaryByIdAsync(report.Id, "bob"))!.IsRead.Should().BeTrue();
    }

    [Fact]
    public async Task MarkAsReadAsync_IsIdempotent()
    {
        await SeedBaseAsync();
        var report = await _db.Context.AddReportAsync("anna", teamId: _team.Id);

        await _sut.MarkAsReadAsync(report.Id, "bob");
        var act = () => _sut.MarkAsReadAsync(report.Id, "bob");

        await act.Should().NotThrowAsync();
        (await _db.NewContext().ReportReads.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task MarkAsReadAsync_TracksReadStateSeparatelyPerUser()
    {
        await SeedBaseAsync();
        var report = await _db.Context.AddReportAsync("anna", teamId: _team.Id);

        await _sut.MarkAsReadAsync(report.Id, "bob");

        (await _sut.GetSummaryByIdAsync(report.Id, "bob"))!.IsRead.Should().BeTrue();
        await _db.Context.AddUserAsync("cleo", "Cleo");
        (await _sut.GetSummaryByIdAsync(report.Id, "cleo"))!.IsRead.Should().BeFalse();
    }

    // ---------- GetPageAsync ----------

    [Fact]
    public async Task GetPageAsync_ReturnsOnlyReportsOfTheTeam_DirectOrThroughPlayer()
    {
        await SeedBaseAsync();
        await _db.Context.AddReportAsync("anna", "direct", teamId: _team.Id);
        await _db.Context.AddReportAsync("anna", "via player", playerId: _player.Id);
        await _db.Context.AddReportAsync("anna", "foreign team", teamId: _otherTeam.Id);
        await _db.Context.AddReportAsync("anna", "foreign player", playerId: _otherPlayer.Id);
        await _db.Context.AddReportAsync("anna", "standalone");

        var page = await _sut.GetPageAsync(_team.Id, "bob", new ReportQuery());

        page.Items.Select(i => i.Title).Should().BeEquivalentTo("direct", "via player");
    }

    [Fact]
    public async Task GetPageAsync_OrdersNewestFirst()
    {
        await SeedBaseAsync();
        var now = DateTime.UtcNow;
        await _db.Context.AddReportAsync("anna", "oldest", teamId: _team.Id, createdAt: now.AddDays(-3));
        await _db.Context.AddReportAsync("anna", "newest", teamId: _team.Id, createdAt: now.AddHours(-1));
        await _db.Context.AddReportAsync("anna", "middle", teamId: _team.Id, createdAt: now.AddDays(-1));

        var page = await _sut.GetPageAsync(_team.Id, "bob", new ReportQuery());

        page.Items.Select(i => i.Title).Should().Equal("newest", "middle", "oldest");
    }

    [Fact]
    public async Task GetPageAsync_UnreadCount_ExcludesOwnAndAlreadyReadReports()
    {
        await SeedBaseAsync();
        var read = await _db.Context.AddReportAsync("anna", "read", teamId: _team.Id);
        await _db.Context.AddReportAsync("anna", "unread 1", teamId: _team.Id);
        await _db.Context.AddReportAsync("anna", "unread 2", teamId: _team.Id);
        await _db.Context.AddReportAsync("bob", "mine", teamId: _team.Id);
        await _db.Context.AddReportAsync("anna", "foreign", teamId: _otherTeam.Id);
        await _sut.MarkAsReadAsync(read.Id, "bob");

        var page = await _sut.GetPageAsync(_team.Id, "bob", new ReportQuery());

        page.UnreadCount.Should().Be(2);
    }

    [Fact]
    public async Task GetPageAsync_UnreadCount_IgnoresActiveFilters()
    {
        await SeedBaseAsync();
        await _db.Context.AddReportAsync("anna", "high", priority: "High", teamId: _team.Id);
        await _db.Context.AddReportAsync("anna", "normal", teamId: _team.Id);

        var page = await _sut.GetPageAsync(_team.Id, "bob", new ReportQuery { HighPriorityOnly = true });

        page.Items.Should().HaveCount(1);
        page.UnreadCount.Should().Be(2);
    }

    [Fact]
    public async Task GetPageAsync_Authors_AreDistinctSortedByNameAndIgnoreFilters()
    {
        await SeedBaseAsync();
        await _db.Context.AddReportAsync("bob", "b1", teamId: _team.Id);
        await _db.Context.AddReportAsync("bob", "b2", teamId: _team.Id);
        await _db.Context.AddReportAsync("anna", "a1", priority: "High", teamId: _team.Id);

        var page = await _sut.GetPageAsync(_team.Id, "anna", new ReportQuery { HighPriorityOnly = true });

        page.Authors.Select(a => a.Name).Should().Equal("Anna Kowalska", "bob@x.pl");
        page.Authors.Select(a => a.Id).Should().Equal("anna", "bob");
    }

    [Fact]
    public async Task GetPageAsync_Kinds_FilterByCombinationOfPlayerTeamAndMatch()
    {
        await SeedBaseAsync();
        await _db.Context.AddReportAsync("anna", "player-match", playerId: _player.Id, matchId: _match.Id);
        await _db.Context.AddReportAsync("anna", "player-general", playerId: _player.Id);
        await _db.Context.AddReportAsync("anna", "team-match", teamId: _team.Id, matchId: _match.Id);
        await _db.Context.AddReportAsync("anna", "team-general", teamId: _team.Id);

        async Task<string[]> TitlesFor(params string[] kinds)
        {
            var page = await _sut.GetPageAsync(_team.Id, "bob", new ReportQuery { Kinds = kinds.ToList() });
            return page.Items.Select(i => i.Title).OrderBy(t => t).ToArray();
        }

        (await TitlesFor("PlayerMatch")).Should().Equal("player-match");
        (await TitlesFor("PlayerGeneral")).Should().Equal("player-general");
        (await TitlesFor("TeamMatch")).Should().Equal("team-match");
        (await TitlesFor("TeamGeneral")).Should().Equal("team-general");
        (await TitlesFor("PlayerMatch", "TeamGeneral")).Should().Equal("player-match", "team-general");
        (await TitlesFor()).Should().HaveCount(4);
    }

    [Fact]
    public async Task GetPageAsync_FiltersByAuthors()
    {
        await SeedBaseAsync();
        await _db.Context.AddReportAsync("anna", "from anna", teamId: _team.Id);
        await _db.Context.AddReportAsync("bob", "from bob", teamId: _team.Id);

        var page = await _sut.GetPageAsync(_team.Id, "cleo",
            new ReportQuery { Authors = new List<string> { "bob" } });

        page.Items.Should().ContainSingle().Which.Title.Should().Be("from bob");
    }

    [Fact]
    public async Task GetPageAsync_HighPriorityOnly_ReturnsOnlyHighPriority()
    {
        await SeedBaseAsync();
        await _db.Context.AddReportAsync("anna", "h", priority: "High", teamId: _team.Id);
        await _db.Context.AddReportAsync("anna", "n", priority: "Normal", teamId: _team.Id);
        await _db.Context.AddReportAsync("anna", "l", priority: "Low", teamId: _team.Id);

        var page = await _sut.GetPageAsync(_team.Id, "bob", new ReportQuery { HighPriorityOnly = true });

        page.Items.Should().ContainSingle().Which.Title.Should().Be("h");
    }

    [Fact]
    public async Task GetPageAsync_UnreadOnly_HidesReadAndOwnReports()
    {
        await SeedBaseAsync();
        var read = await _db.Context.AddReportAsync("anna", "read", teamId: _team.Id);
        await _db.Context.AddReportAsync("anna", "unread", teamId: _team.Id);
        await _db.Context.AddReportAsync("bob", "mine", teamId: _team.Id);
        await _sut.MarkAsReadAsync(read.Id, "bob");

        var page = await _sut.GetPageAsync(_team.Id, "bob", new ReportQuery { UnreadOnly = true });

        page.Items.Should().ContainSingle().Which.Title.Should().Be("unread");
    }

    [Fact]
    public async Task GetPageAsync_Items_CarryPerUserReadFlag()
    {
        await SeedBaseAsync();
        var read = await _db.Context.AddReportAsync("anna", "read", teamId: _team.Id);
        await _db.Context.AddReportAsync("anna", "unread", teamId: _team.Id);
        await _sut.MarkAsReadAsync(read.Id, "bob");

        var page = await _sut.GetPageAsync(_team.Id, "bob", new ReportQuery());

        page.Items.Single(i => i.Title == "read").IsRead.Should().BeTrue();
        page.Items.Single(i => i.Title == "unread").IsRead.Should().BeFalse();
    }

    [Fact]
    public async Task GetPageAsync_Days_LimitsItemsAndSetsHasMore()
    {
        await SeedBaseAsync();
        var now = DateTime.UtcNow;
        await _db.Context.AddReportAsync("anna", "recent", teamId: _team.Id, createdAt: now.AddDays(-2));
        await _db.Context.AddReportAsync("anna", "old", teamId: _team.Id, createdAt: now.AddDays(-40));

        var page = await _sut.GetPageAsync(_team.Id, "bob", new ReportQuery { Days = 30 });

        page.Items.Should().ContainSingle().Which.Title.Should().Be("recent");
        page.HasMore.Should().BeTrue();
    }

    [Fact]
    public async Task GetPageAsync_HasMoreIsFalse_WhenNothingOlderThanCutoff()
    {
        await SeedBaseAsync();
        await _db.Context.AddReportAsync("anna", "recent", teamId: _team.Id, createdAt: DateTime.UtcNow.AddDays(-2));

        var page = await _sut.GetPageAsync(_team.Id, "bob", new ReportQuery { Days = 30 });

        page.HasMore.Should().BeFalse();
    }

    [Fact]
    public async Task GetPageAsync_HasMore_RespectsActiveFilters()
    {
        await SeedBaseAsync();
        var now = DateTime.UtcNow;
        await _db.Context.AddReportAsync("anna", "recent high", priority: "High", teamId: _team.Id, createdAt: now.AddDays(-1));
        await _db.Context.AddReportAsync("anna", "old normal", priority: "Normal", teamId: _team.Id, createdAt: now.AddDays(-60));

        var page = await _sut.GetPageAsync(_team.Id, "bob", new ReportQuery { Days = 30, HighPriorityOnly = true });

        page.HasMore.Should().BeFalse();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-5)]
    public async Task GetPageAsync_Days_IsClampedToAtLeastOneDay(int days)
    {
        await SeedBaseAsync();
        var now = DateTime.UtcNow;
        await _db.Context.AddReportAsync("anna", "today", teamId: _team.Id, createdAt: now.AddHours(-1));
        await _db.Context.AddReportAsync("anna", "three days ago", teamId: _team.Id, createdAt: now.AddDays(-3));

        var page = await _sut.GetPageAsync(_team.Id, "bob", new ReportQuery { Days = days });

        page.Items.Should().ContainSingle().Which.Title.Should().Be("today");
        page.HasMore.Should().BeTrue();
    }

    [Fact]
    public async Task GetPageAsync_Days_IsClampedToTenYears()
    {
        await SeedBaseAsync();
        await _db.Context.AddReportAsync("anna", "ancient", teamId: _team.Id, createdAt: DateTime.UtcNow.AddDays(-3000));
        await _db.Context.AddReportAsync("anna", "prehistoric", teamId: _team.Id, createdAt: DateTime.UtcNow.AddDays(-5000));

        var page = await _sut.GetPageAsync(_team.Id, "bob", new ReportQuery { Days = int.MaxValue });

        page.Items.Should().ContainSingle().Which.Title.Should().Be("ancient");
        page.HasMore.Should().BeTrue();
    }

    [Theory]
    [InlineData("kowalski")]
    [InlineData("RIVAL")]
    [InlineData("hamstring")]
    [InlineData("Weekly")]
    public async Task GetPageAsync_Search_MatchesTitleContentPlayerAndOpponent_IgnoringCase(string search)
    {
        await SeedBaseAsync();
        await _db.Context.AddReportAsync("anna", "Weekly check", "hamstring injury concern",
            playerId: _player.Id, teamId: _team.Id, matchId: _match.Id);
        await _db.Context.AddReportAsync("anna", "Unrelated", "nothing here", teamId: _team.Id);

        var page = await _sut.GetPageAsync(_team.Id, "bob", new ReportQuery { Search = search });

        page.Items.Should().ContainSingle().Which.Title.Should().Be("Weekly check");
    }

    [Fact]
    public async Task GetPageAsync_Search_IgnoresDaysCutoffAndNeverHasMore()
    {
        await SeedBaseAsync();
        await _db.Context.AddReportAsync("anna", "ancient scouting", teamId: _team.Id,
            createdAt: DateTime.UtcNow.AddDays(-400));

        var page = await _sut.GetPageAsync(_team.Id, "bob", new ReportQuery { Days = 7, Search = "scouting" });

        page.Items.Should().ContainSingle();
        page.HasMore.Should().BeFalse();
    }

    [Fact]
    public async Task GetPageAsync_Search_IsCombinedWithOtherFilters()
    {
        await SeedBaseAsync();
        await _db.Context.AddReportAsync("anna", "match plan", priority: "High", teamId: _team.Id);
        await _db.Context.AddReportAsync("anna", "match review", priority: "Normal", teamId: _team.Id);

        var page = await _sut.GetPageAsync(_team.Id, "bob",
            new ReportQuery { Search = "match", HighPriorityOnly = true });

        page.Items.Should().ContainSingle().Which.Title.Should().Be("match plan");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public async Task GetPageAsync_BlankSearch_IsTreatedAsNoSearch(string? search)
    {
        await SeedBaseAsync();
        await _db.Context.AddReportAsync("anna", "old", teamId: _team.Id, createdAt: DateTime.UtcNow.AddDays(-100));
        await _db.Context.AddReportAsync("anna", "new", teamId: _team.Id);

        var page = await _sut.GetPageAsync(_team.Id, "bob", new ReportQuery { Days = 30, Search = search });

        page.Items.Should().ContainSingle().Which.Title.Should().Be("new");
        page.HasMore.Should().BeTrue();
    }

    [Fact]
    public async Task GetPageAsync_ReturnsEmptyPage_WhenTeamHasNoReports()
    {
        await SeedBaseAsync();

        var page = await _sut.GetPageAsync(_team.Id, "bob", new ReportQuery());

        page.Items.Should().BeEmpty();
        page.Authors.Should().BeEmpty();
        page.UnreadCount.Should().Be(0);
        page.HasMore.Should().BeFalse();
    }
}
