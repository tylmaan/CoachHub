using CoachHub.Api.Services;

namespace CoachHub.Api.UnitTests.Services;

public class PlayerStatsServiceTests : IDisposable
{
    private readonly TestDb _db = new();
    private readonly PlayerStatsService _sut;

    public PlayerStatsServiceTests()
    {
        _sut = new PlayerStatsService(_db.Context);
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task ReturnsEmpty_WhenTeamHasNoPlayersOrMatches()
    {
        var team = await _db.Context.AddTeamAsync();

        (await _sut.GetStatsForTeamAsync(team.Id)).Should().BeEmpty();
    }

    [Fact]
    public async Task Starter_WithoutSubstitution_PlaysFullNinetyMinutes()
    {
        var team = await _db.Context.AddTeamAsync();
        var player = await _db.Context.AddPlayerAsync(team.Id);
        var match = await _db.Context.AddMatchAsync(team.Id);
        await _db.Context.AddAppearanceAsync(match.Id, player.Id, isStarting: true);

        var stats = await _sut.GetStatsForTeamAsync(team.Id);

        var row = stats.Should().ContainSingle().Subject;
        row.Matches.Should().Be(1);
        row.Minutes.Should().Be(90);
        row.Season.Should().Be("2025/26");
    }

    [Fact]
    public async Task Starter_SubstitutedOff_PlaysUntilThatMinute()
    {
        var team = await _db.Context.AddTeamAsync();
        var player = await _db.Context.AddPlayerAsync(team.Id);
        var match = await _db.Context.AddMatchAsync(team.Id);
        await _db.Context.AddAppearanceAsync(match.Id, player.Id, isStarting: true);
        await _db.Context.AddEventAsync(match.Id, "SubstitutionOff", player.Id, 62);

        var row = (await _sut.GetStatsForTeamAsync(team.Id)).Single();

        row.Minutes.Should().Be(62);
        row.Matches.Should().Be(1);
    }

    [Fact]
    public async Task Starter_SubstitutedOffWithoutMinute_FallsBackToNinety()
    {
        var team = await _db.Context.AddTeamAsync();
        var player = await _db.Context.AddPlayerAsync(team.Id);
        var match = await _db.Context.AddMatchAsync(team.Id);
        await _db.Context.AddAppearanceAsync(match.Id, player.Id, isStarting: true);
        await _db.Context.AddEventAsync(match.Id, "SubstitutionOff", player.Id, minute: null);

        (await _sut.GetStatsForTeamAsync(team.Id)).Single().Minutes.Should().Be(90);
    }

    [Fact]
    public async Task Substitute_SubstitutedIn_PlaysFromThatMinuteToNinety()
    {
        var team = await _db.Context.AddTeamAsync();
        var player = await _db.Context.AddPlayerAsync(team.Id);
        var match = await _db.Context.AddMatchAsync(team.Id);
        await _db.Context.AddAppearanceAsync(match.Id, player.Id, isStarting: false);
        await _db.Context.AddEventAsync(match.Id, "SubstitutionIn", player.Id, 70);

        var row = (await _sut.GetStatsForTeamAsync(team.Id)).Single();

        row.Minutes.Should().Be(20);
        row.Matches.Should().Be(1);
    }

    [Fact]
    public async Task Substitute_NeverEntered_HasRowButZeroMinutesAndMatches()
    {
        var team = await _db.Context.AddTeamAsync();
        var player = await _db.Context.AddPlayerAsync(team.Id);
        var match = await _db.Context.AddMatchAsync(team.Id);
        await _db.Context.AddAppearanceAsync(match.Id, player.Id, isStarting: false);

        var row = (await _sut.GetStatsForTeamAsync(team.Id)).Single();

        row.Minutes.Should().Be(0);
        row.Matches.Should().Be(0);
    }

    [Fact]
    public async Task PlayerWithoutAppearances_ProducesNoRow()
    {
        var team = await _db.Context.AddTeamAsync();
        await _db.Context.AddPlayerAsync(team.Id);
        await _db.Context.AddMatchAsync(team.Id);

        (await _sut.GetStatsForTeamAsync(team.Id)).Should().BeEmpty();
    }

    [Fact]
    public async Task CountsGoalsAssistsAndCards_OfOurPlayerOnly()
    {
        var team = await _db.Context.AddTeamAsync();
        var player = await _db.Context.AddPlayerAsync(team.Id);
        var match = await _db.Context.AddMatchAsync(team.Id);
        await _db.Context.AddAppearanceAsync(match.Id, player.Id);
        await _db.Context.AddEventAsync(match.Id, "Goal", player.Id, 10);
        await _db.Context.AddEventAsync(match.Id, "PenaltyGoal", player.Id, 40);
        await _db.Context.AddEventAsync(match.Id, "OwnGoal", player.Id, 50);
        await _db.Context.AddEventAsync(match.Id, "Assist", player.Id, 10);
        await _db.Context.AddEventAsync(match.Id, "YellowCard", player.Id, 30);
        await _db.Context.AddEventAsync(match.Id, "YellowCard", player.Id, 60);
        await _db.Context.AddEventAsync(match.Id, "RedCard", player.Id, 61);
        await _db.Context.AddEventAsync(match.Id, "Goal", player.Id, 80, team: "Opponent");

        var row = (await _sut.GetStatsForTeamAsync(team.Id)).Single();

        row.Goals.Should().Be(2);
        row.Assists.Should().Be(1);
        row.YellowCards.Should().Be(2);
        row.RedCards.Should().Be(1);
    }

    [Fact]
    public async Task IgnoresMatchesThatAreNotPlayed()
    {
        var team = await _db.Context.AddTeamAsync();
        var player = await _db.Context.AddPlayerAsync(team.Id);
        var planned = await _db.Context.AddMatchAsync(team.Id, status: "Planned");
        await _db.Context.AddAppearanceAsync(planned.Id, player.Id);

        (await _sut.GetStatsForTeamAsync(team.Id)).Should().BeEmpty();
    }

    [Fact]
    public async Task IgnoresOtherTeamsPlayersAndMatches()
    {
        var team = await _db.Context.AddTeamAsync("Mine");
        var other = await _db.Context.AddTeamAsync("Other");
        var otherPlayer = await _db.Context.AddPlayerAsync(other.Id);
        var otherMatch = await _db.Context.AddMatchAsync(other.Id);
        await _db.Context.AddAppearanceAsync(otherMatch.Id, otherPlayer.Id);

        (await _sut.GetStatsForTeamAsync(team.Id)).Should().BeEmpty();
    }

    [Fact]
    public async Task AggregatesPerSeason_AndSumsAcrossMatchesOfTheSameSeason()
    {
        var team = await _db.Context.AddTeamAsync();
        var player = await _db.Context.AddPlayerAsync(team.Id);
        var m1 = await _db.Context.AddMatchAsync(team.Id, season: "2025/26");
        var m2 = await _db.Context.AddMatchAsync(team.Id, season: "2025/26");
        var m3 = await _db.Context.AddMatchAsync(team.Id, season: "2024/25");
        await _db.Context.AddAppearanceAsync(m1.Id, player.Id);
        await _db.Context.AddAppearanceAsync(m2.Id, player.Id);
        await _db.Context.AddAppearanceAsync(m3.Id, player.Id);
        await _db.Context.AddEventAsync(m1.Id, "Goal", player.Id, 5);
        await _db.Context.AddEventAsync(m2.Id, "Goal", player.Id, 6);
        await _db.Context.AddEventAsync(m3.Id, "Goal", player.Id, 7);

        var stats = await _sut.GetStatsForTeamAsync(team.Id);

        stats.Should().HaveCount(2);
        var current = stats.Single(s => s.Season == "2025/26");
        current.Matches.Should().Be(2);
        current.Minutes.Should().Be(180);
        current.Goals.Should().Be(2);
        var previous = stats.Single(s => s.Season == "2024/25");
        previous.Matches.Should().Be(1);
        previous.Goals.Should().Be(1);
    }

    [Fact]
    public async Task OrdersBySeasonDescendingThenByLastName()
    {
        var team = await _db.Context.AddTeamAsync();
        var zielinski = await _db.Context.AddPlayerAsync(team.Id, "Z", "Zielinski");
        var adamski = await _db.Context.AddPlayerAsync(team.Id, "A", "Adamski");
        var older = await _db.Context.AddMatchAsync(team.Id, season: "2023/24");
        var newer = await _db.Context.AddMatchAsync(team.Id, season: "2025/26");
        foreach (var match in new[] { older, newer })
        {
            await _db.Context.AddAppearanceAsync(match.Id, zielinski.Id);
            await _db.Context.AddAppearanceAsync(match.Id, adamski.Id);
        }

        var stats = await _sut.GetStatsForTeamAsync(team.Id);

        stats.Select(s => (s.Season, s.LastName)).Should().Equal(
            ("2025/26", "Adamski"),
            ("2025/26", "Zielinski"),
            ("2023/24", "Adamski"),
            ("2023/24", "Zielinski"));
    }

    [Fact]
    public async Task EventsOfOtherPlayersInTheSameMatch_AreNotAttributed()
    {
        var team = await _db.Context.AddTeamAsync();
        var scorer = await _db.Context.AddPlayerAsync(team.Id, "S", "Scorer");
        var bystander = await _db.Context.AddPlayerAsync(team.Id, "B", "Bystander");
        var match = await _db.Context.AddMatchAsync(team.Id);
        await _db.Context.AddAppearanceAsync(match.Id, scorer.Id);
        await _db.Context.AddAppearanceAsync(match.Id, bystander.Id);
        await _db.Context.AddEventAsync(match.Id, "Goal", scorer.Id, 20);

        var stats = await _sut.GetStatsForTeamAsync(team.Id);

        stats.Single(s => s.LastName == "Scorer").Goals.Should().Be(1);
        stats.Single(s => s.LastName == "Bystander").Goals.Should().Be(0);
    }
}
