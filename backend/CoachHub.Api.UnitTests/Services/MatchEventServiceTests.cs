using CoachHub.Api.Models;
using CoachHub.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace CoachHub.Api.UnitTests.Services;

public class MatchEventServiceTests : IDisposable
{
    private readonly TestDb _db = new();
    private readonly MatchEventService _sut;

    public MatchEventServiceTests()
    {
        _sut = new MatchEventService(_db.Context);
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task CreateAsync_PersistsEvent()
    {
        var team = await _db.Context.AddTeamAsync();
        var match = await _db.Context.AddMatchAsync(team.Id);

        var created = await _sut.CreateAsync(new MatchEvent
        {
            MatchId = match.Id, EventType = "Goal", Team = "Us", Minute = 33
        });

        created.Id.Should().BeGreaterThan(0);
        (await _db.NewContext().MatchEvents.SingleAsync()).Minute.Should().Be(33);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsEventOrNull()
    {
        var team = await _db.Context.AddTeamAsync();
        var match = await _db.Context.AddMatchAsync(team.Id);
        var ev = await _db.Context.AddEventAsync(match.Id, "YellowCard", minute: 10);

        (await _sut.GetByIdAsync(ev.Id))!.EventType.Should().Be("YellowCard");
        (await _sut.GetByIdAsync(404)).Should().BeNull();
    }

    [Fact]
    public async Task GetByMatchIdAsync_ReturnsOnlyEventsOfThatMatch()
    {
        var team = await _db.Context.AddTeamAsync();
        var m1 = await _db.Context.AddMatchAsync(team.Id);
        var m2 = await _db.Context.AddMatchAsync(team.Id);
        await _db.Context.AddEventAsync(m1.Id, "Goal", minute: 1);
        await _db.Context.AddEventAsync(m1.Id, "Goal", minute: 2);
        await _db.Context.AddEventAsync(m2.Id, "Goal", minute: 3);

        var result = await _sut.GetByMatchIdAsync(m1.Id);

        result.Should().HaveCount(2).And.OnlyContain(e => e.MatchId == m1.Id);
    }

    [Fact]
    public async Task UpdateAsync_CopiesEditableFields_ButNotMatch()
    {
        var team = await _db.Context.AddTeamAsync();
        var m1 = await _db.Context.AddMatchAsync(team.Id);
        var m2 = await _db.Context.AddMatchAsync(team.Id);
        var player = await _db.Context.AddPlayerAsync(team.Id);
        var ev = await _db.Context.AddEventAsync(m1.Id, "Goal", minute: 10);

        var ok = await _sut.UpdateAsync(ev.Id, new MatchEvent
        {
            MatchId = m2.Id,
            EventType = "Assist",
            Team = "Opponent",
            Minute = 55,
            AddedTime = 2,
            PlayerId = player.Id,
            OpponentPlayerName = "Kowal"
        });

        ok.Should().BeTrue();
        var saved = await _db.NewContext().MatchEvents.SingleAsync();
        saved.EventType.Should().Be("Assist");
        saved.Team.Should().Be("Opponent");
        saved.Minute.Should().Be(55);
        saved.AddedTime.Should().Be(2);
        saved.PlayerId.Should().Be(player.Id);
        saved.OpponentPlayerName.Should().Be("Kowal");
        saved.MatchId.Should().Be(m1.Id);
    }

    [Fact]
    public async Task UpdateAsync_ReturnsFalse_WhenMissing()
    {
        var update = new MatchEvent { EventType = "Goal", Team = "Us" };

        (await _sut.UpdateAsync(404, update)).Should().BeFalse();
    }

    [Fact]
    public async Task DeleteAsync_RemovesEvent_OrReturnsFalse()
    {
        var team = await _db.Context.AddTeamAsync();
        var match = await _db.Context.AddMatchAsync(team.Id);
        var ev = await _db.Context.AddEventAsync(match.Id, "Goal", minute: 1);

        (await _sut.DeleteAsync(ev.Id)).Should().BeTrue();
        (await _sut.DeleteAsync(ev.Id)).Should().BeFalse();
        (await _db.NewContext().MatchEvents.CountAsync()).Should().Be(0);
    }
}
