using CoachHub.Api.DTOs;
using CoachHub.Api.Models;
using CoachHub.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace CoachHub.Api.UnitTests.Services;

public class TacticalSchemeServiceTests : IDisposable
{
    private readonly TestDb _db = new();
    private readonly TacticalSchemeService _sut;

    public TacticalSchemeServiceTests()
    {
        _sut = new TacticalSchemeService(_db.Context);
    }

    public void Dispose() => _db.Dispose();

    private async Task<(Team team, Match match)> SeedAsync()
    {
        await _db.Context.AddUserAsync("u1");
        var team = await _db.Context.AddTeamAsync();
        var match = await _db.Context.AddMatchAsync(team.Id);
        return (team, match);
    }

    [Fact]
    public async Task CreateAsync_PersistsSchemeAndReturnsSummary()
    {
        var (_, match) = await SeedAsync();

        var summary = await _sut.CreateAsync(new TacticalScheme
        {
            Name = "High press", Data = "{\"a\":1}", MatchId = match.Id, CreatedByUserId = "u1"
        });

        summary.Id.Should().BeGreaterThan(0);
        summary.Name.Should().Be("High press");
        summary.Data.Should().Be("{\"a\":1}");
        summary.MatchId.Should().Be(match.Id);
        summary.ReportId.Should().BeNull();
        (await _db.NewContext().TacticalSchemes.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task GetByMatchIdAsync_ReturnsSchemesOfMatchOrderedByCreation()
    {
        var (team, match) = await SeedAsync();
        var otherMatch = await _db.Context.AddMatchAsync(team.Id);
        var now = DateTime.UtcNow;
        await _db.Context.AddSchemeAsync("u1", "second", matchId: match.Id, createdAt: now);
        await _db.Context.AddSchemeAsync("u1", "first", matchId: match.Id, createdAt: now.AddHours(-1));
        await _db.Context.AddSchemeAsync("u1", "other", matchId: otherMatch.Id);

        var result = await _sut.GetByMatchIdAsync(match.Id);

        result.Select(s => s.Name).Should().Equal("first", "second");
    }

    [Fact]
    public async Task GetByReportIdAsync_ReturnsSchemesOfReportOrderedByCreation()
    {
        var (_, _) = await SeedAsync();
        var report1 = await _db.Context.AddReportAsync("u1");
        var report2 = await _db.Context.AddReportAsync("u1");
        var now = DateTime.UtcNow;
        await _db.Context.AddSchemeAsync("u1", "b", reportId: report1.Id, createdAt: now);
        await _db.Context.AddSchemeAsync("u1", "a", reportId: report1.Id, createdAt: now.AddMinutes(-5));
        await _db.Context.AddSchemeAsync("u1", "x", reportId: report2.Id);

        var result = await _sut.GetByReportIdAsync(report1.Id);

        result.Select(s => s.Name).Should().Equal("a", "b");
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsSummaryOrNull()
    {
        await SeedAsync();
        var scheme = await _db.Context.AddSchemeAsync("u1", "Plan A");

        (await _sut.GetByIdAsync(scheme.Id))!.Name.Should().Be("Plan A");
        (await _sut.GetByIdAsync(404)).Should().BeNull();
    }

    [Fact]
    public async Task UpdateAsync_ChangesNameAndData_AndBumpsUpdatedAtOnly()
    {
        await SeedAsync();
        var created = DateTime.UtcNow.AddDays(-2);
        var scheme = await _db.Context.AddSchemeAsync("u1", "Old", "{}", createdAt: created);

        var ok = await _sut.UpdateAsync(scheme.Id, new TacticalSchemeRequest { Name = "New", Data = "{\"x\":2}" });

        ok.Should().BeTrue();
        var saved = await _db.NewContext().TacticalSchemes.SingleAsync();
        saved.Name.Should().Be("New");
        saved.Data.Should().Be("{\"x\":2}");
        saved.CreatedAt.Should().BeCloseTo(created, TimeSpan.FromSeconds(1));
        saved.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(30));
    }

    [Fact]
    public async Task UpdateAsync_ReturnsFalse_WhenMissing()
    {
        var request = new TacticalSchemeRequest { Name = "n", Data = "d" };

        (await _sut.UpdateAsync(404, request)).Should().BeFalse();
    }

    [Fact]
    public async Task DeleteAsync_RemovesScheme_OrReturnsFalse()
    {
        await SeedAsync();
        var scheme = await _db.Context.AddSchemeAsync("u1");

        (await _sut.DeleteAsync(scheme.Id)).Should().BeTrue();
        (await _sut.DeleteAsync(scheme.Id)).Should().BeFalse();
    }

    [Fact]
    public async Task DeletingMatch_CascadesToItsSchemes()
    {
        var (_, match) = await SeedAsync();
        await _db.Context.AddSchemeAsync("u1", matchId: match.Id);

        _db.Context.Matches.Remove(match);
        await _db.Context.SaveChangesAsync();

        (await _db.NewContext().TacticalSchemes.CountAsync()).Should().Be(0);
    }
}
