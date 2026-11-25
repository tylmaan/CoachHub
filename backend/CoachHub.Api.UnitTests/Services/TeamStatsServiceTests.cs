using CoachHub.Api.Services;

namespace CoachHub.Api.UnitTests.Services;

public class TeamStatsServiceTests : IDisposable
{
    private readonly TestDb _db = new();
    private readonly TeamStatsService _sut;

    public TeamStatsServiceTests()
    {
        _sut = new TeamStatsService(_db.Context);
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task ReturnsEmpty_WhenNoPlayedMatches()
    {
        var team = await _db.Context.AddTeamAsync();
        await _db.Context.AddMatchAsync(team.Id, status: "Planned", scoreFor: null, scoreAgainst: null);

        (await _sut.GetStatsForTeamAsync(team.Id)).Should().BeEmpty();
    }

    [Fact]
    public async Task IgnoresPlayedMatchesWithoutScore_AndMatchesOfOtherTeams()
    {
        var team = await _db.Context.AddTeamAsync();
        var other = await _db.Context.AddTeamAsync("Other");
        await _db.Context.AddMatchAsync(team.Id, scoreFor: null, scoreAgainst: null);
        await _db.Context.AddMatchAsync(team.Id, scoreFor: 2, scoreAgainst: null);
        await _db.Context.AddMatchAsync(other.Id, scoreFor: 1, scoreAgainst: 1);

        (await _sut.GetStatsForTeamAsync(team.Id)).Should().BeEmpty();
    }

    [Fact]
    public async Task GroupsBySeason_NewestSeasonFirst()
    {
        var team = await _db.Context.AddTeamAsync();
        await _db.Context.AddMatchAsync(team.Id, season: "2023/24");
        await _db.Context.AddMatchAsync(team.Id, season: "2025/26");
        await _db.Context.AddMatchAsync(team.Id, season: "2024/25");

        var stats = await _sut.GetStatsForTeamAsync(team.Id);

        stats.Select(s => s.Season).Should().Equal("2025/26", "2024/25", "2023/24");
    }

    [Fact]
    public async Task Results_AreOrderedByDateThenId_AndMapMatchFields()
    {
        var team = await _db.Context.AddTeamAsync();
        var later = await _db.Context.AddMatchAsync(team.Id, opponent: "Later", scoreFor: 3, scoreAgainst: 1,
            date: new DateOnly(2025, 10, 10));
        var earlySecond = await _db.Context.AddMatchAsync(team.Id, opponent: "Early B",
            date: new DateOnly(2025, 9, 1));
        var earlyFirstId = await _db.Context.AddMatchAsync(team.Id, opponent: "Early A",
            date: new DateOnly(2025, 9, 1));

        var results = (await _sut.GetStatsForTeamAsync(team.Id)).Single().Results;

        results.Select(r => r.Opponent).Should().Equal("Early B", "Early A", "Later");
        results.Last().MatchId.Should().Be(later.Id);
        results.Last().ScoreFor.Should().Be(3);
        results.Last().ScoreAgainst.Should().Be(1);
        results.Last().Date.Should().Be(new DateOnly(2025, 10, 10));
        earlySecond.Id.Should().BeLessThan(earlyFirstId.Id);
    }

    [Theory]
    [InlineData(1, 0)]
    [InlineData(15, 0)]
    [InlineData(16, 1)]
    [InlineData(30, 1)]
    [InlineData(31, 2)]
    [InlineData(45, 2)]
    [InlineData(46, 3)]
    [InlineData(60, 3)]
    [InlineData(61, 4)]
    [InlineData(75, 4)]
    [InlineData(76, 5)]
    [InlineData(90, 5)]
    [InlineData(91, 6)]
    [InlineData(120, 6)]
    [InlineData(0, 0)]
    public async Task GoalsScored_AreBucketedIntoFifteenMinutePeriods(int minute, int expectedPeriod)
    {
        var team = await _db.Context.AddTeamAsync();
        var match = await _db.Context.AddMatchAsync(team.Id);
        await _db.Context.AddEventAsync(match.Id, "Goal", minute: minute, team: "Us");

        var stats = (await _sut.GetStatsForTeamAsync(team.Id)).Single();

        var expected = new int[7];
        expected[expectedPeriod] = 1;
        stats.GoalsScoredByPeriod.Should().Equal(expected);
        stats.GoalsConcededByPeriod.Should().Equal(new int[7]);
    }

    [Fact]
    public async Task GoalsConceded_AreCountedForOpponentGoals()
    {
        var team = await _db.Context.AddTeamAsync();
        var match = await _db.Context.AddMatchAsync(team.Id);
        await _db.Context.AddEventAsync(match.Id, "Goal", minute: 20, team: "Opponent");
        await _db.Context.AddEventAsync(match.Id, "PenaltyGoal", minute: 22, team: "Opponent");

        var stats = (await _sut.GetStatsForTeamAsync(team.Id)).Single();

        stats.GoalsConcededByPeriod.Should().Equal(0, 2, 0, 0, 0, 0, 0);
        stats.GoalsScoredByPeriod.Should().Equal(new int[7]);
    }

    [Fact]
    public async Task PenaltyGoal_CountsAsScoredGoal()
    {
        var team = await _db.Context.AddTeamAsync();
        var match = await _db.Context.AddMatchAsync(team.Id);
        await _db.Context.AddEventAsync(match.Id, "PenaltyGoal", minute: 10, team: "Us");

        (await _sut.GetStatsForTeamAsync(team.Id)).Single().GoalsScoredByPeriod[0].Should().Be(1);
    }

    [Fact]
    public async Task OwnGoals_CountForTheOtherSide()
    {
        var team = await _db.Context.AddTeamAsync();
        var match = await _db.Context.AddMatchAsync(team.Id);
        await _db.Context.AddEventAsync(match.Id, "OwnGoal", minute: 10, team: "Us");
        await _db.Context.AddEventAsync(match.Id, "OwnGoal", minute: 50, team: "Opponent");

        var stats = (await _sut.GetStatsForTeamAsync(team.Id)).Single();

        stats.GoalsConcededByPeriod.Should().Equal(1, 0, 0, 0, 0, 0, 0);
        stats.GoalsScoredByPeriod.Should().Equal(0, 0, 0, 1, 0, 0, 0);
    }

    [Fact]
    public async Task GoalsWithoutMinute_AreSkipped_ButCardsStillCounted()
    {
        var team = await _db.Context.AddTeamAsync();
        var match = await _db.Context.AddMatchAsync(team.Id);
        await _db.Context.AddEventAsync(match.Id, "Goal", minute: null, team: "Us");
        await _db.Context.AddEventAsync(match.Id, "YellowCard", minute: null, team: "Us");

        var stats = (await _sut.GetStatsForTeamAsync(team.Id)).Single();

        stats.GoalsScoredByPeriod.Should().Equal(new int[7]);
        stats.YellowCards.Should().Be(1);
    }

    [Fact]
    public async Task Cards_AreCountedOnlyForOurTeam_AndSummedAcrossSeasonMatches()
    {
        var team = await _db.Context.AddTeamAsync();
        var m1 = await _db.Context.AddMatchAsync(team.Id);
        var m2 = await _db.Context.AddMatchAsync(team.Id);
        await _db.Context.AddEventAsync(m1.Id, "YellowCard", minute: 10, team: "Us");
        await _db.Context.AddEventAsync(m2.Id, "YellowCard", minute: 11, team: "Us");
        await _db.Context.AddEventAsync(m2.Id, "YellowCard", minute: 12, team: "Opponent");
        await _db.Context.AddEventAsync(m2.Id, "RedCard", minute: 80, team: "Us");
        await _db.Context.AddEventAsync(m1.Id, "RedCard", minute: 81, team: "Opponent");

        var stats = (await _sut.GetStatsForTeamAsync(team.Id)).Single();

        stats.YellowCards.Should().Be(2);
        stats.RedCards.Should().Be(1);
    }

    [Fact]
    public async Task EventsAreAggregatedPerSeason_NotAcrossSeasons()
    {
        var team = await _db.Context.AddTeamAsync();
        var current = await _db.Context.AddMatchAsync(team.Id, season: "2025/26");
        var previous = await _db.Context.AddMatchAsync(team.Id, season: "2024/25");
        await _db.Context.AddEventAsync(current.Id, "YellowCard", minute: 5, team: "Us");
        await _db.Context.AddEventAsync(previous.Id, "YellowCard", minute: 5, team: "Us");
        await _db.Context.AddEventAsync(previous.Id, "YellowCard", minute: 6, team: "Us");

        var stats = await _sut.GetStatsForTeamAsync(team.Id);

        stats.Single(s => s.Season == "2025/26").YellowCards.Should().Be(1);
        stats.Single(s => s.Season == "2024/25").YellowCards.Should().Be(2);
    }
}
