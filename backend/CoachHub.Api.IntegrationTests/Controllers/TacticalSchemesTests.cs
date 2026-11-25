using System.Net;
using System.Net.Http.Json;
using CoachHub.Api.DTOs;
using CoachHub.Api.UnitTests.Helpers;
using Microsoft.EntityFrameworkCore;

namespace CoachHub.Api.IntegrationTests.Controllers;

public class TacticalSchemesTests : ApiTestBase
{
    private const string ValidData = "{\"players\":[{\"x\":10,\"y\":20}]}";

    public TacticalSchemesTests(CoachHubFactory factory) : base(factory) { }

    private static object Body(string name = "Corner routine", string data = ValidData) => new { name, data };

    // ---------- read ----------

    [Fact]
    public async Task GetByMatch_ReturnsSchemesOfAnOwnMatch()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Analyst).GetAsync($"/api/tacticalschemes/match/{world.PlannedMatch.Id}");

        ShouldBe(response, HttpStatusCode.OK);
        var schemes = await ReadAsync<List<TacticalSchemeSummary>>(response);
        schemes.Should().ContainSingle().Which.Id.Should().Be(world.MatchScheme.Id);
    }

    [Fact]
    public async Task GetByMatch_Forbids_ForeignOrMissingMatch()
    {
        var world = await NewWorldAsync();
        var coach = world.As(world.Coach);

        ShouldBe(await coach.GetAsync($"/api/tacticalschemes/match/{world.OtherMatch.Id}"), HttpStatusCode.Forbidden);
        ShouldBe(await coach.GetAsync("/api/tacticalschemes/match/999999"), HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task GetByReport_ReturnsSchemesOfAnOwnReport_ForbidsOthers()
    {
        var world = await NewWorldAsync();
        var analyst = world.As(world.Analyst);

        var response = await analyst.GetAsync($"/api/tacticalschemes/report/{world.Report.Id}");
        ShouldBe(response, HttpStatusCode.OK);
        (await ReadAsync<List<TacticalSchemeSummary>>(response)).Should().ContainSingle()
            .Which.Id.Should().Be(world.ReportScheme.Id);

        ShouldBe(await analyst.GetAsync($"/api/tacticalschemes/report/{world.OtherReport.Id}"), HttpStatusCode.Forbidden);
        ShouldBe(await analyst.GetAsync("/api/tacticalschemes/report/999999"), HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task GetById_WorksForMatchAndReportSchemes_ForbidsForeign_404sMissing()
    {
        var world = await NewWorldAsync();
        var analyst = world.As(world.Analyst);
        var foreign = await Factory.WithDbAsync(db =>
            db.AddSchemeAsync(world.OtherCoach.Id, "foreign", "{}", matchId: world.OtherMatch.Id));

        ShouldBe(await analyst.GetAsync($"/api/tacticalschemes/{world.MatchScheme.Id}"), HttpStatusCode.OK);
        ShouldBe(await analyst.GetAsync($"/api/tacticalschemes/{world.ReportScheme.Id}"), HttpStatusCode.OK);
        ShouldBe(await analyst.GetAsync($"/api/tacticalschemes/{foreign.Id}"), HttpStatusCode.Forbidden);
        ShouldBe(await analyst.GetAsync("/api/tacticalschemes/999999"), HttpStatusCode.NotFound);
    }

    // ---------- create for match ----------

    [Fact]
    public async Task CreateForMatch_StoresSchemeOnAPlannedMatch()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Assistant)
            .PostAsJsonAsync($"/api/tacticalschemes/match/{world.PlannedMatch.Id}", Body("High press"));

        ShouldBe(response, HttpStatusCode.Created);
        response.Headers.Location.Should().NotBeNull();
        var created = await ReadAsync<TacticalSchemeSummary>(response);
        created.MatchId.Should().Be(world.PlannedMatch.Id);
        created.ReportId.Should().BeNull();
        var saved = await Factory.WithDbAsync(db => db.TacticalSchemes.SingleAsync(s => s.Id == created.Id));
        saved.Name.Should().Be("High press");
        saved.Data.Should().Be(ValidData);
        saved.CreatedByUserId.Should().Be(world.Assistant.Id);
    }

    [Fact]
    public async Task CreateForMatch_Returns400_ForAMatchThatWasAlreadyPlayed()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Coach)
            .PostAsJsonAsync($"/api/tacticalschemes/match/{world.PlayedMatch.Id}", Body());

        ShouldBe(response, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateForMatch_Forbids_ForeignOrMissingMatch()
    {
        var world = await NewWorldAsync();
        var coach = world.As(world.Coach);

        ShouldBe(await coach.PostAsJsonAsync($"/api/tacticalschemes/match/{world.OtherMatch.Id}", Body()), HttpStatusCode.Forbidden);
        ShouldBe(await coach.PostAsJsonAsync("/api/tacticalschemes/match/999999", Body()), HttpStatusCode.Forbidden);
    }

    // ---------- payload validation ----------

    public static TheoryData<string, string> InvalidPayloads => new()
    {
        { "", ValidData },
        { "   ", ValidData },
        { "name", "not json at all" },
        { "name", "[1,2,3]" },
        { "name", "\"just a string\"" },
        { "name", "42" },
        { "name", "null" },
        { "name", "{\"unterminated\":" },
    };

    [Theory]
    [MemberData(nameof(InvalidPayloads))]
    public async Task Create_Returns400_ForInvalidNameOrData(string name, string data)
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Coach)
            .PostAsJsonAsync($"/api/tacticalschemes/match/{world.PlannedMatch.Id}", Body(name, data));

        ShouldBe(response, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Create_NameIsLimitedTo100Characters()
    {
        var world = await NewWorldAsync();
        var coach = world.As(world.Coach);
        var url = $"/api/tacticalschemes/match/{world.PlannedMatch.Id}";

        ShouldBe(await coach.PostAsJsonAsync(url, Body(new string('n', 100))), HttpStatusCode.Created);
        ShouldBe(await coach.PostAsJsonAsync(url, Body(new string('n', 101))), HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Create_DataIsLimitedTo100000Characters()
    {
        var world = await NewWorldAsync();
        var coach = world.As(world.Coach);
        var url = $"/api/tacticalschemes/match/{world.PlannedMatch.Id}";

        string DataOfLength(int length)
        {
            const string frame = "{\"a\":\"\"}";
            return "{\"a\":\"" + new string('x', length - frame.Length) + "\"}";
        }

        ShouldBe(await coach.PostAsJsonAsync(url, Body(data: DataOfLength(100_000))), HttpStatusCode.Created);
        ShouldBe(await coach.PostAsJsonAsync(url, Body(data: DataOfLength(100_001))), HttpStatusCode.BadRequest);
    }

    // ---------- create for report ----------

    [Fact]
    public async Task CreateForReport_IsAllowedForCoachAndForTheReportAuthor()
    {
        var world = await NewWorldAsync();
        var analystReport = await Factory.WithDbAsync(db => db.AddReportAsync(world.Analyst.Id, teamId: world.Team.Id));

        var byCoach = await world.As(world.Coach)
            .PostAsJsonAsync($"/api/tacticalschemes/report/{world.Report.Id}", Body());
        var byAuthor = await world.As(world.Analyst)
            .PostAsJsonAsync($"/api/tacticalschemes/report/{analystReport.Id}", Body());

        ShouldBe(byCoach, HttpStatusCode.Created);
        ShouldBe(byAuthor, HttpStatusCode.Created);
        (await ReadAsync<TacticalSchemeSummary>(byAuthor)).ReportId.Should().Be(analystReport.Id);
    }

    [Fact]
    public async Task CreateForReport_Forbids_NonAuthorNonCoach()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Assistant)
            .PostAsJsonAsync($"/api/tacticalschemes/report/{world.Report.Id}", Body());

        ShouldBe(response, HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task CreateForReport_Forbids_ForeignOrMissingReport()
    {
        var world = await NewWorldAsync();
        var coach = world.As(world.Coach);

        ShouldBe(await coach.PostAsJsonAsync($"/api/tacticalschemes/report/{world.OtherReport.Id}", Body()), HttpStatusCode.Forbidden);
        ShouldBe(await coach.PostAsJsonAsync("/api/tacticalschemes/report/999999", Body()), HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task CreateForReport_Returns400_ForInvalidData()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Coach)
            .PostAsJsonAsync($"/api/tacticalschemes/report/{world.Report.Id}", Body(data: "[]"));

        ShouldBe(response, HttpStatusCode.BadRequest);
    }

    // ---------- update ----------

    [Fact]
    public async Task Update_MatchScheme_IsAllowedForCoachAndAssistant_NotForAnalyst()
    {
        var world = await NewWorldAsync();
        var url = $"/api/tacticalschemes/{world.MatchScheme.Id}";

        ShouldBe(await world.As(world.Coach).PutAsJsonAsync(url, Body("By coach", "{\"v\":1}")), HttpStatusCode.NoContent);
        ShouldBe(await world.As(world.Assistant).PutAsJsonAsync(url, Body("By assistant", "{\"v\":2}")), HttpStatusCode.NoContent);
        ShouldBe(await world.As(world.Analyst).PutAsJsonAsync(url, Body("By analyst")), HttpStatusCode.Forbidden);

        var saved = await Factory.WithDbAsync(db => db.TacticalSchemes.SingleAsync(s => s.Id == world.MatchScheme.Id));
        saved.Name.Should().Be("By assistant");
        saved.Data.Should().Be("{\"v\":2}");
        saved.UpdatedAt.Should().BeAfter(saved.CreatedAt);
    }

    [Fact]
    public async Task Update_ReportScheme_IsAllowedForCoachAndReportAuthorOnly()
    {
        var world = await NewWorldAsync();
        var analystReport = await Factory.WithDbAsync(db => db.AddReportAsync(world.Analyst.Id, teamId: world.Team.Id));
        var analystScheme = await Factory.WithDbAsync(db =>
            db.AddSchemeAsync(world.Analyst.Id, "analyst scheme", "{}", reportId: analystReport.Id));

        ShouldBe(await world.As(world.Analyst).PutAsJsonAsync($"/api/tacticalschemes/{analystScheme.Id}", Body("edited")),
            HttpStatusCode.NoContent);
        ShouldBe(await world.As(world.Coach).PutAsJsonAsync($"/api/tacticalschemes/{analystScheme.Id}", Body("by coach")),
            HttpStatusCode.NoContent);
        ShouldBe(await world.As(world.Assistant).PutAsJsonAsync($"/api/tacticalschemes/{analystScheme.Id}", Body("nope")),
            HttpStatusCode.Forbidden);
        ShouldBe(await world.As(world.Analyst).PutAsJsonAsync($"/api/tacticalschemes/{world.ReportScheme.Id}", Body("nope")),
            HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Update_Returns400_ForInvalidPayload_AndKeepsTheScheme()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Coach)
            .PutAsJsonAsync($"/api/tacticalschemes/{world.MatchScheme.Id}", Body("ok", "[]"));

        ShouldBe(response, HttpStatusCode.BadRequest);
        var saved = await Factory.WithDbAsync(db => db.TacticalSchemes.SingleAsync(s => s.Id == world.MatchScheme.Id));
        saved.Name.Should().Be("Match scheme");
    }

    [Fact]
    public async Task Update_Forbids_ForeignScheme_And404sMissing()
    {
        var world = await NewWorldAsync();
        var foreign = await Factory.WithDbAsync(db =>
            db.AddSchemeAsync(world.OtherCoach.Id, "foreign", "{}", matchId: world.OtherMatch.Id));
        var coach = world.As(world.Coach);

        ShouldBe(await coach.PutAsJsonAsync($"/api/tacticalschemes/{foreign.Id}", Body()), HttpStatusCode.Forbidden);
        ShouldBe(await coach.PutAsJsonAsync("/api/tacticalschemes/999999", Body()), HttpStatusCode.NotFound);
    }

    // ---------- delete ----------

    [Fact]
    public async Task Delete_MatchScheme_IsAllowedForCoachOnly()
    {
        var world = await NewWorldAsync();
        var url = $"/api/tacticalschemes/{world.MatchScheme.Id}";

        ShouldBe(await world.As(world.Assistant).DeleteAsync(url), HttpStatusCode.Forbidden);
        ShouldBe(await world.As(world.Analyst).DeleteAsync(url), HttpStatusCode.Forbidden);
        ShouldBe(await world.As(world.Coach).DeleteAsync(url), HttpStatusCode.NoContent);
        ShouldBe(await world.As(world.Coach).GetAsync(url), HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Delete_ReportScheme_IsAllowedForReportAuthorAndCoach()
    {
        var world = await NewWorldAsync();
        var analystReport = await Factory.WithDbAsync(db => db.AddReportAsync(world.Analyst.Id, teamId: world.Team.Id));
        var first = await Factory.WithDbAsync(db =>
            db.AddSchemeAsync(world.Analyst.Id, "first", "{}", reportId: analystReport.Id));
        var second = await Factory.WithDbAsync(db =>
            db.AddSchemeAsync(world.Analyst.Id, "second", "{}", reportId: analystReport.Id));

        ShouldBe(await world.As(world.Assistant).DeleteAsync($"/api/tacticalschemes/{first.Id}"), HttpStatusCode.Forbidden);
        ShouldBe(await world.As(world.Analyst).DeleteAsync($"/api/tacticalschemes/{first.Id}"), HttpStatusCode.NoContent);
        ShouldBe(await world.As(world.Coach).DeleteAsync($"/api/tacticalschemes/{second.Id}"), HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Delete_Forbids_ForeignScheme_And404sMissing()
    {
        var world = await NewWorldAsync();
        var foreign = await Factory.WithDbAsync(db =>
            db.AddSchemeAsync(world.OtherCoach.Id, "foreign", "{}", matchId: world.OtherMatch.Id));
        var coach = world.As(world.Coach);

        ShouldBe(await coach.DeleteAsync($"/api/tacticalschemes/{foreign.Id}"), HttpStatusCode.Forbidden);
        ShouldBe(await coach.DeleteAsync("/api/tacticalschemes/999999"), HttpStatusCode.NotFound);
    }
}
