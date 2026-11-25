using CoachHub.Api.Data;
using CoachHub.Api.IntegrationTests.Infrastructure;
using CoachHub.Api.Models;
using CoachHub.Api.UnitTests.Helpers;

namespace CoachHub.Api.IntegrationTests.Infrastructure;

public sealed class World
{
    private readonly CoachHubFactory _factory;

    public World(CoachHubFactory factory) => _factory = factory;

    public Team Team { get; private set; } = null!;
    public Team OtherTeam { get; private set; } = null!;
    public Team SpareTeam { get; private set; } = null!;

    public TestUser Admin { get; private set; } = null!;
    public TestUser Coach { get; private set; } = null!;
    public TestUser Assistant { get; private set; } = null!;
    public TestUser Analyst { get; private set; } = null!;
    public TestUser OtherCoach { get; private set; } = null!;

    public Player Player { get; private set; } = null!;
    public Player OtherPlayer { get; private set; } = null!;
    public Match PlannedMatch { get; private set; } = null!;
    public Match PlayedMatch { get; private set; } = null!;
    public Match OtherMatch { get; private set; } = null!;
    public MatchAppearance Appearance { get; private set; } = null!;
    public MatchEvent Event { get; private set; } = null!;
    public Report Report { get; private set; } = null!;
    public Report OtherReport { get; private set; } = null!;
    public TacticalScheme MatchScheme { get; private set; } = null!;
    public TacticalScheme ReportScheme { get; private set; } = null!;

    public static async Task<World> CreateAsync(CoachHubFactory factory)
    {
        var world = new World(factory);

        world.Admin = await factory.CreateUserAsync(Roles.Admin, null);

        (world.Team, world.OtherTeam, world.SpareTeam) = await factory.WithDbAsync(async db =>
            (await db.AddTeamAsync($"Team {Guid.NewGuid():N}"),
             await db.AddTeamAsync($"Other {Guid.NewGuid():N}"),
             await db.AddTeamAsync($"Spare {Guid.NewGuid():N}")));

        world.Coach = await factory.CreateUserAsync(Roles.Coach, world.Team.Id);
        world.Assistant = await factory.CreateUserAsync(Roles.AssistantCoach, world.Team.Id);
        world.Analyst = await factory.CreateUserAsync(Roles.Analyst, world.Team.Id);
        world.OtherCoach = await factory.CreateUserAsync(Roles.Coach, world.OtherTeam.Id);

        await factory.WithDbAsync(async db =>
        {
            world.Player = await db.AddPlayerAsync(world.Team.Id, "Jan", "Kowalski");
            world.OtherPlayer = await db.AddPlayerAsync(world.OtherTeam.Id, "Obcy", "Zawodnik");
            world.PlannedMatch = await db.AddMatchAsync(world.Team.Id, status: "Planned", scoreFor: null, scoreAgainst: null);
            world.PlayedMatch = await db.AddMatchAsync(world.Team.Id, status: "Played", scoreFor: 2, scoreAgainst: 1);
            world.OtherMatch = await db.AddMatchAsync(world.OtherTeam.Id);
            world.Appearance = await db.AddAppearanceAsync(world.PlayedMatch.Id, world.Player.Id);
            world.Event = await db.AddEventAsync(world.PlayedMatch.Id, "Goal", world.Player.Id, 30);
            world.Report = await db.AddReportAsync(world.Coach.Id, "Team report", "Body", teamId: world.Team.Id);
            world.OtherReport = await db.AddReportAsync(world.OtherCoach.Id, "Foreign report", "Body", teamId: world.OtherTeam.Id);
            world.MatchScheme = await db.AddSchemeAsync(world.Coach.Id, "Match scheme", "{}", matchId: world.PlannedMatch.Id);
            world.ReportScheme = await db.AddSchemeAsync(world.Coach.Id, "Report scheme", "{}", reportId: world.Report.Id);
        });

        return world;
    }

    public HttpClient As(TestUser user) => _factory.ClientFor(user);
    public HttpClient Anonymous() => _factory.ClientFor();
}
