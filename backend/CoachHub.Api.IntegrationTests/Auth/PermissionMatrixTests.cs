using System.Net;
using System.Net.Http.Json;

namespace CoachHub.Api.IntegrationTests.Auth;

// Role codes: A = Admin, C = Coach, S = AssistantCoach, N = Analyst.
// Only the role attributes are checked here: bodies are intentionally empty, so an allowed
// caller may legitimately get 400/404/204 but never 401/403.
public class PermissionMatrixTests : ApiTestBase
{
    public PermissionMatrixTests(CoachHubFactory factory) : base(factory) { }

    public static TheoryData<string, string, string> Endpoints => new()
    {
        { "POST", "/api/auth/register", "A" },

        { "GET", "/api/users", "A" },
        { "PUT", "/api/users/{analystUser}", "A" },
        { "DELETE", "/api/users/{analystUser}", "A" },

        { "POST", "/api/files/upload", "ACSN" },

        { "GET", "/api/teams", "ACSN" },
        { "GET", "/api/teams/{team}", "ACSN" },
        { "POST", "/api/teams", "A" },
        { "PUT", "/api/teams/{team}", "A" },
        { "DELETE", "/api/teams/{spareTeam}", "A" },

        { "GET", "/api/players", "CSN" },
        { "GET", "/api/players/{player}", "CSN" },
        { "POST", "/api/players", "CS" },
        { "PUT", "/api/players/{player}", "CS" },
        { "DELETE", "/api/players/{player}", "C" },
        { "POST", "/api/players/{player}/archive", "C" },
        { "POST", "/api/players/{player}/restore", "C" },
        { "GET", "/api/players/{player}/deletion-impact", "C" },

        { "GET", "/api/matches", "CSN" },
        { "GET", "/api/matches/{plannedMatch}", "CSN" },
        { "POST", "/api/matches", "CS" },
        { "PUT", "/api/matches/{plannedMatch}", "CS" },
        { "PUT", "/api/matches/{plannedMatch}/game-plan", "CS" },
        { "PUT", "/api/matches/{plannedMatch}/opponent-notes", "CSN" },
        { "DELETE", "/api/matches/{playedMatch}", "C" },

        { "GET", "/api/matchappearances/match/{playedMatch}", "CSN" },
        { "POST", "/api/matchappearances", "CS" },
        { "PUT", "/api/matchappearances/{appearance}", "CS" },
        { "DELETE", "/api/matchappearances/{appearance}", "C" },

        { "GET", "/api/matchevents/match/{playedMatch}", "CSN" },
        { "POST", "/api/matchevents", "CS" },
        { "PUT", "/api/matchevents/{event}", "CS" },
        { "DELETE", "/api/matchevents/{event}", "C" },

        { "GET", "/api/playerstats", "CSN" },
        { "GET", "/api/teamstats", "CSN" },

        { "GET", "/api/reports", "CSN" },
        { "GET", "/api/reports/{report}", "CSN" },
        { "GET", "/api/reports/player/{player}", "CSN" },
        { "GET", "/api/reports/team/{team}", "CSN" },
        { "GET", "/api/reports/user/{coachUser}", "CSN" },
        { "POST", "/api/reports/{report}/read", "CSN" },
        { "POST", "/api/reports", "CSN" },
        { "DELETE", "/api/reports/{report}", "C" },

        { "GET", "/api/tacticalschemes/match/{plannedMatch}", "CSN" },
        { "GET", "/api/tacticalschemes/report/{report}", "CSN" },
        { "GET", "/api/tacticalschemes/{scheme}", "CSN" },
        { "POST", "/api/tacticalschemes/match/{plannedMatch}", "CS" },
    };

    private static string Resolve(string path, World w) => path
        .Replace("{analystUser}", w.Analyst.Id)
        .Replace("{coachUser}", w.Coach.Id)
        .Replace("{spareTeam}", w.SpareTeam.Id.ToString())
        .Replace("{team}", w.Team.Id.ToString())
        .Replace("{player}", w.Player.Id.ToString())
        .Replace("{plannedMatch}", w.PlannedMatch.Id.ToString())
        .Replace("{playedMatch}", w.PlayedMatch.Id.ToString())
        .Replace("{appearance}", w.Appearance.Id.ToString())
        .Replace("{event}", w.Event.Id.ToString())
        .Replace("{report}", w.Report.Id.ToString())
        .Replace("{scheme}", w.MatchScheme.Id.ToString());

    private static HttpContent? BodyFor(string method, string url, World w)
    {
        if (url == "/api/files/upload")
        {
            var form = new MultipartFormDataContent();
            form.Add(new ByteArrayContent(new byte[] { 1, 2, 3 }), "file", "matrix.png");
            return form;
        }

        if (method == "POST" && url == "/api/matchappearances")
            return JsonContent.Create(new { matchId = w.PlayedMatch.Id, playerId = w.Player.Id, isStarting = false });

        return method is "POST" or "PUT" ? JsonContent.Create(new { }) : null;
    }

    private static async Task<HttpStatusCode> SendAsync(HttpClient client, string method, string url, World world)
    {
        var request = new HttpRequestMessage(new HttpMethod(method), url) { Content = BodyFor(method, url, world) };
        return (await client.SendAsync(request)).StatusCode;
    }

    [Theory]
    [MemberData(nameof(Endpoints))]
    public async Task Endpoint_EnforcesRoleAccess(string method, string pathTemplate, string allowedRoles)
    {
        var world = await NewWorldAsync();
        var url = Resolve(pathTemplate, world);

        var callers = new (char Code, string Name, TestUser User)[]
        {
            ('A', "Admin", world.Admin),
            ('C', "Coach", world.Coach),
            ('S', "AssistantCoach", world.Assistant),
            ('N', "Analyst", world.Analyst)
        };

        var problems = new List<string>();
        foreach (var (code, name, user) in callers)
        {
            var status = await SendAsync(world.As(user), method, url, world);
            var shouldBeAllowed = allowedRoles.Contains(code);

            if (shouldBeAllowed && status is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden)
                problems.Add($"{name} should be allowed but got {(int)status}");
            if (!shouldBeAllowed && status != HttpStatusCode.Forbidden)
                problems.Add($"{name} should get 403 but got {(int)status}");
        }

        var anonymous = await SendAsync(world.Anonymous(), method, url, world);
        if (anonymous != HttpStatusCode.Unauthorized)
            problems.Add($"Anonymous should get 401 but got {(int)anonymous}");

        problems.Should().BeEmpty($"{method} {url}");
    }
}
