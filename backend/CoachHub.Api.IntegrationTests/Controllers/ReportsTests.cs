using System.Net;
using System.Net.Http.Json;
using CoachHub.Api.Data;
using CoachHub.Api.DTOs;
using CoachHub.Api.Models;
using CoachHub.Api.UnitTests.Helpers;
using Microsoft.EntityFrameworkCore;

namespace CoachHub.Api.IntegrationTests.Controllers;

public class ReportsTests : ApiTestBase
{
    public ReportsTests(CoachHubFactory factory) : base(factory) { }

    private static object Body(
        string title = "Weekly review",
        string content = "Solid performance",
        string priority = "Normal",
        int? playerId = null,
        int? teamId = null,
        int? matchId = null) => new { title, content, priority, playerId, teamId, matchId };

    private async Task<ReportSummary> CreateAsync(HttpClient client, object body)
    {
        var response = await client.PostAsJsonAsync("/api/reports", body);
        ShouldBe(response, HttpStatusCode.Created);
        return await ReadAsync<ReportSummary>(response);
    }

    // ---------- create ----------

    [Fact]
    public async Task Create_TeamReport_ReturnsSummaryOwnedByTheCaller()
    {
        var world = await NewWorldAsync();

        var summary = await CreateAsync(world.As(world.Analyst), Body(teamId: world.Team.Id, priority: "High"));

        summary.Title.Should().Be("Weekly review");
        summary.Priority.Should().Be("High");
        summary.TeamId.Should().Be(world.Team.Id);
        summary.TeamName.Should().Be(world.Team.Name);
        summary.AuthorId.Should().Be(world.Analyst.Id);
        summary.IsRead.Should().BeTrue();
        summary.CanEdit.Should().BeTrue();
    }

    [Fact]
    public async Task Create_PlayerReportWithMatch_MapsRelatedData()
    {
        var world = await NewWorldAsync();

        var summary = await CreateAsync(world.As(world.Assistant),
            Body(playerId: world.Player.Id, matchId: world.PlayedMatch.Id));

        summary.PlayerName.Should().Be("Jan Kowalski");
        summary.MatchId.Should().Be(world.PlayedMatch.Id);
        summary.MatchOpponent.Should().Be(world.PlayedMatch.Opponent);
    }

    [Fact]
    public async Task Create_DefaultsPriorityToNormal_WhenOmitted()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Coach)
            .PostAsJsonAsync("/api/reports", new { title = "No priority", content = "x", teamId = world.Team.Id });

        ShouldBe(response, HttpStatusCode.Created);
        (await ReadAsync<ReportSummary>(response)).Priority.Should().Be("Normal");
    }

    [Theory]
    [InlineData("", "content", "Normal")]
    [InlineData("   ", "content", "Normal")]
    [InlineData("title", "", "Normal")]
    [InlineData("title", "   ", "Normal")]
    [InlineData("title", "content", "Urgent")]
    [InlineData("title", "content", "high")]
    public async Task Create_Returns400_ForInvalidFields(string title, string content, string priority)
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Coach)
            .PostAsJsonAsync("/api/reports", Body(title, content, priority, teamId: world.Team.Id));

        ShouldBe(response, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Create_TitleIsLimitedTo200Characters()
    {
        var world = await NewWorldAsync();
        var coach = world.As(world.Coach);

        ShouldBe(await coach.PostAsJsonAsync("/api/reports", Body(new string('t', 200), teamId: world.Team.Id)),
            HttpStatusCode.Created);
        ShouldBe(await coach.PostAsJsonAsync("/api/reports", Body(new string('t', 201), teamId: world.Team.Id)),
            HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Create_RequiresExactlyOneOfPlayerOrTeam()
    {
        var world = await NewWorldAsync();
        var coach = world.As(world.Coach);

        ShouldBe(await coach.PostAsJsonAsync("/api/reports", Body()), HttpStatusCode.BadRequest);
        ShouldBe(await coach.PostAsJsonAsync("/api/reports", Body(playerId: world.Player.Id, teamId: world.Team.Id)),
            HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Create_Returns400_ForForeignTeamPlayerOrMatch()
    {
        var world = await NewWorldAsync();
        var coach = world.As(world.Coach);

        ShouldBe(await coach.PostAsJsonAsync("/api/reports", Body(teamId: world.OtherTeam.Id)), HttpStatusCode.BadRequest);
        ShouldBe(await coach.PostAsJsonAsync("/api/reports", Body(playerId: world.OtherPlayer.Id)), HttpStatusCode.BadRequest);
        ShouldBe(await coach.PostAsJsonAsync("/api/reports", Body(playerId: 999_999)), HttpStatusCode.BadRequest);
        ShouldBe(await coach.PostAsJsonAsync("/api/reports", Body(teamId: world.Team.Id, matchId: world.OtherMatch.Id)),
            HttpStatusCode.BadRequest);
        ShouldBe(await coach.PostAsJsonAsync("/api/reports", Body(teamId: world.Team.Id, matchId: 999_999)),
            HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Create_Returns400_ForStaffWithoutTeam()
    {
        var world = await NewWorldAsync();
        var drifter = await Factory.CreateUserAsync(Roles.Analyst, null);

        var response = await world.As(drifter).PostAsJsonAsync("/api/reports", Body(teamId: world.Team.Id));

        ShouldBe(response, HttpStatusCode.BadRequest);
    }

    // ---------- list / filters ----------

    [Fact]
    public async Task GetAll_ReturnsReportsOfTheCallersTeamOnly()
    {
        var world = await NewWorldAsync();

        var page = await ReadAsync<ReportPage>(await world.As(world.Analyst).GetAsync("/api/reports"));

        page.Items.Select(i => i.Id).Should().Equal(world.Report.Id);
        page.Authors.Select(a => a.Id).Should().Equal(world.Coach.Id);
    }

    [Fact]
    public async Task GetAll_ForStaffWithoutTeam_ReturnsEmptyPage()
    {
        var world = await NewWorldAsync();
        var drifter = await Factory.CreateUserAsync(Roles.Analyst, null);

        var page = await ReadAsync<ReportPage>(await world.As(drifter).GetAsync("/api/reports"));

        page.Items.Should().BeEmpty();
        page.UnreadCount.Should().Be(0);
    }

    [Fact]
    public async Task GetAll_AppliesQueryStringFilters()
    {
        var world = await NewWorldAsync();
        var analyst = world.As(world.Analyst);
        var high = await CreateAsync(analyst, Body("Urgent injury", "Hamstring", "High", playerId: world.Player.Id));
        var general = await CreateAsync(analyst, Body("General note", "Nothing special", "Low", teamId: world.Team.Id));

        async Task<int[]> IdsFor(string query)
        {
            var page = await ReadAsync<ReportPage>(await analyst.GetAsync("/api/reports" + query));
            return page.Items.Select(i => i.Id).OrderBy(i => i).ToArray();
        }

        (await IdsFor("?HighPriorityOnly=true")).Should().Equal(high.Id);
        (await IdsFor("?Kinds=PlayerGeneral")).Should().Equal(high.Id);
        (await IdsFor("?Kinds=TeamGeneral")).Should().BeEquivalentTo(new[] { world.Report.Id, general.Id });
        (await IdsFor("?Kinds=PlayerGeneral&Kinds=TeamGeneral")).Should().HaveCount(3);
        (await IdsFor($"?Authors={world.Analyst.Id}")).Should().BeEquivalentTo(new[] { high.Id, general.Id });
        (await IdsFor("?Search=hamstring")).Should().Equal(high.Id);
        (await IdsFor("?Search=KOWALSKI")).Should().Equal(high.Id);
    }

    [Fact]
    public async Task GetAll_FlagsWhichReportsTheCallerCanEdit()
    {
        var world = await NewWorldAsync();
        var mine = await CreateAsync(world.As(world.Analyst), Body(teamId: world.Team.Id));

        var analystPage = await ReadAsync<ReportPage>(await world.As(world.Analyst).GetAsync("/api/reports"));
        analystPage.Items.Single(i => i.Id == mine.Id).CanEdit.Should().BeTrue();
        analystPage.Items.Single(i => i.Id == world.Report.Id).CanEdit.Should().BeFalse();

        var coachPage = await ReadAsync<ReportPage>(await world.As(world.Coach).GetAsync("/api/reports"));
        coachPage.Items.Should().OnlyContain(i => i.CanEdit);
    }

    [Fact]
    public async Task GetAll_UnreadFilterAndCounter_FollowTheCallersReadState()
    {
        var world = await NewWorldAsync();
        var analyst = world.As(world.Analyst);

        var before = await ReadAsync<ReportPage>(await analyst.GetAsync("/api/reports?UnreadOnly=true"));
        before.UnreadCount.Should().Be(1);
        before.Items.Should().ContainSingle().Which.IsRead.Should().BeFalse();

        ShouldBe(await analyst.PostAsync($"/api/reports/{world.Report.Id}/read", null), HttpStatusCode.NoContent);

        var after = await ReadAsync<ReportPage>(await analyst.GetAsync("/api/reports?UnreadOnly=true"));
        after.UnreadCount.Should().Be(0);
        after.Items.Should().BeEmpty();

        var assistantView = await ReadAsync<ReportPage>(await world.As(world.Assistant).GetAsync("/api/reports?UnreadOnly=true"));
        assistantView.UnreadCount.Should().Be(1);
    }

    // ---------- get by id ----------

    [Fact]
    public async Task GetById_ReturnsSummary_ForbidsForeign_404sMissing()
    {
        var world = await NewWorldAsync();
        var analyst = world.As(world.Analyst);

        var own = await analyst.GetAsync($"/api/reports/{world.Report.Id}");
        ShouldBe(own, HttpStatusCode.OK);
        var summary = await ReadAsync<ReportSummary>(own);
        summary.IsRead.Should().BeFalse();
        summary.CanEdit.Should().BeFalse();
        summary.AuthorId.Should().Be(world.Coach.Id);

        ShouldBe(await analyst.GetAsync($"/api/reports/{world.OtherReport.Id}"), HttpStatusCode.Forbidden);
        ShouldBe(await analyst.GetAsync("/api/reports/999999"), HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetById_IsAccessibleThroughThePlayersTeam_ForPlayerReports()
    {
        var world = await NewWorldAsync();
        var summary = await CreateAsync(world.As(world.Coach), Body(playerId: world.Player.Id));

        ShouldBe(await world.As(world.Analyst).GetAsync($"/api/reports/{summary.Id}"), HttpStatusCode.OK);
        ShouldBe(await world.As(world.OtherCoach).GetAsync($"/api/reports/{summary.Id}"), HttpStatusCode.Forbidden);
    }

    // ---------- by player / team / user ----------

    [Fact]
    public async Task ByPlayer_ReturnsThePlayersReports_ForOwnTeamOnly()
    {
        var world = await NewWorldAsync();
        var created = await CreateAsync(world.As(world.Coach), Body(playerId: world.Player.Id));
        var coach = world.As(world.Coach);

        var reports = await ReadAsync<List<Report>>(await coach.GetAsync($"/api/reports/player/{world.Player.Id}"));
        reports.Should().ContainSingle().Which.Id.Should().Be(created.Id);

        ShouldBe(await coach.GetAsync($"/api/reports/player/{world.OtherPlayer.Id}"), HttpStatusCode.Forbidden);
        ShouldBe(await coach.GetAsync("/api/reports/player/999999"), HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task ByTeam_ReturnsTeamReports_ForOwnTeamOnly()
    {
        var world = await NewWorldAsync();
        var coach = world.As(world.Coach);

        var reports = await ReadAsync<List<Report>>(await coach.GetAsync($"/api/reports/team/{world.Team.Id}"));
        reports.Select(r => r.Id).Should().Equal(world.Report.Id);

        ShouldBe(await coach.GetAsync($"/api/reports/team/{world.OtherTeam.Id}"), HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task ByUser_ReturnsOnlyReportsInTheCallersTeam()
    {
        var world = await NewWorldAsync();
        var coach = world.As(world.Coach);

        var own = await ReadAsync<List<Report>>(await coach.GetAsync($"/api/reports/user/{world.Coach.Id}"));
        own.Select(r => r.Id).Should().Equal(world.Report.Id);

        var foreign = await ReadAsync<List<Report>>(await coach.GetAsync($"/api/reports/user/{world.OtherCoach.Id}"));
        foreign.Should().BeEmpty();
    }

    [Fact]
    public async Task ReportEndpoints_NeverLeakPasswordHashes()
    {
        var world = await NewWorldAsync();
        var coach = world.As(world.Coach);

        foreach (var url in new[]
        {
            "/api/reports", $"/api/reports/{world.Report.Id}", $"/api/reports/team/{world.Team.Id}",
            $"/api/reports/user/{world.Coach.Id}", $"/api/reports/player/{world.Player.Id}"
        })
        {
            var raw = await (await coach.GetAsync(url)).Content.ReadAsStringAsync();
            raw.Should().NotContainEquivalentOf("passwordHash", url);
        }
    }

    // ---------- mark as read ----------

    [Fact]
    public async Task MarkAsRead_IsIdempotent_AndMakesTheReportRead()
    {
        var world = await NewWorldAsync();
        var analyst = world.As(world.Analyst);

        ShouldBe(await analyst.PostAsync($"/api/reports/{world.Report.Id}/read", null), HttpStatusCode.NoContent);
        ShouldBe(await analyst.PostAsync($"/api/reports/{world.Report.Id}/read", null), HttpStatusCode.NoContent);

        var summary = await ReadAsync<ReportSummary>(await analyst.GetAsync($"/api/reports/{world.Report.Id}"));
        summary.IsRead.Should().BeTrue();
    }

    [Fact]
    public async Task MarkAsRead_Forbids_Foreign_And404sMissing()
    {
        var world = await NewWorldAsync();
        var analyst = world.As(world.Analyst);

        ShouldBe(await analyst.PostAsync($"/api/reports/{world.OtherReport.Id}/read", null), HttpStatusCode.Forbidden);
        ShouldBe(await analyst.PostAsync("/api/reports/999999/read", null), HttpStatusCode.NotFound);
    }

    // ---------- update ----------

    [Fact]
    public async Task Update_AuthorCanEditOwnReport()
    {
        var world = await NewWorldAsync();
        var mine = await CreateAsync(world.As(world.Assistant), Body("Draft", teamId: world.Team.Id));

        var response = await world.As(world.Assistant).PutAsJsonAsync(
            $"/api/reports/{mine.Id}", Body("Final", "Edited body", "High", teamId: world.Team.Id));

        ShouldBe(response, HttpStatusCode.NoContent);
        var saved = await Factory.WithDbAsync(db => db.Reports.SingleAsync(r => r.Id == mine.Id));
        saved.Title.Should().Be("Final");
        saved.Content.Should().Be("Edited body");
        saved.Priority.Should().Be("High");
        saved.CreatedByUserId.Should().Be(world.Assistant.Id);
    }

    [Fact]
    public async Task Update_CoachCanEditAnyReportInTheTeam_ButKeepsTheAuthor()
    {
        var world = await NewWorldAsync();
        var theirs = await CreateAsync(world.As(world.Analyst), Body("By analyst", teamId: world.Team.Id));

        var response = await world.As(world.Coach).PutAsJsonAsync(
            $"/api/reports/{theirs.Id}", Body("Corrected by coach", teamId: world.Team.Id));

        ShouldBe(response, HttpStatusCode.NoContent);
        var saved = await Factory.WithDbAsync(db => db.Reports.SingleAsync(r => r.Id == theirs.Id));
        saved.Title.Should().Be("Corrected by coach");
        saved.CreatedByUserId.Should().Be(world.Analyst.Id);
    }

    [Fact]
    public async Task Update_Forbids_NonCoachEditingSomeoneElsesReport()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Analyst).PutAsJsonAsync(
            $"/api/reports/{world.Report.Id}", Body("Hijacked", teamId: world.Team.Id));

        ShouldBe(response, HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Update_Forbids_ForeignReport_And404sMissing()
    {
        var world = await NewWorldAsync();
        var coach = world.As(world.Coach);

        ShouldBe(await coach.PutAsJsonAsync($"/api/reports/{world.OtherReport.Id}", Body(teamId: world.Team.Id)),
            HttpStatusCode.Forbidden);
        ShouldBe(await coach.PutAsJsonAsync("/api/reports/999999", Body(teamId: world.Team.Id)),
            HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Update_Returns400_ForInvalidBody_AndKeepsTheReport()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Coach).PutAsJsonAsync(
            $"/api/reports/{world.Report.Id}", Body("", teamId: world.Team.Id));

        ShouldBe(response, HttpStatusCode.BadRequest);
        var saved = await Factory.WithDbAsync(db => db.Reports.SingleAsync(r => r.Id == world.Report.Id));
        saved.Title.Should().Be("Team report");
    }

    [Fact]
    public async Task Update_CannotRetargetTheReportToAnotherTeam()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Coach).PutAsJsonAsync(
            $"/api/reports/{world.Report.Id}", Body(teamId: world.OtherTeam.Id));

        ShouldBe(response, HttpStatusCode.BadRequest);
    }

    // ---------- delete ----------

    [Fact]
    public async Task Delete_RemovesReportWithItsSchemesAndReadMarks()
    {
        var world = await NewWorldAsync();
        await world.As(world.Analyst).PostAsync($"/api/reports/{world.Report.Id}/read", null);

        ShouldBe(await world.As(world.Coach).DeleteAsync($"/api/reports/{world.Report.Id}"), HttpStatusCode.NoContent);

        await Factory.WithDbAsync(async db =>
        {
            (await db.Reports.AnyAsync(r => r.Id == world.Report.Id)).Should().BeFalse();
            (await db.ReportReads.AnyAsync(r => r.ReportId == world.Report.Id)).Should().BeFalse();
            (await db.TacticalSchemes.AnyAsync(s => s.Id == world.ReportScheme.Id)).Should().BeFalse();
        });
    }

    [Fact]
    public async Task Delete_Forbids_ForeignReport_And404sMissing()
    {
        var world = await NewWorldAsync();
        var coach = world.As(world.Coach);

        ShouldBe(await coach.DeleteAsync($"/api/reports/{world.OtherReport.Id}"), HttpStatusCode.Forbidden);
        ShouldBe(await coach.DeleteAsync("/api/reports/999999"), HttpStatusCode.NotFound);
    }
}
