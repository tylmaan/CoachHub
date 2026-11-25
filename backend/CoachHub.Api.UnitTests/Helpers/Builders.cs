using CoachHub.Api.Data;
using CoachHub.Api.Models;

namespace CoachHub.Api.UnitTests.Helpers;

public static class Builders
{
    public static async Task<Team> AddTeamAsync(this ApplicationDbContext db, string name = "City", string? logoUrl = null)
    {
        var team = new Team { Name = name, LogoUrl = logoUrl };
        db.Teams.Add(team);
        await db.SaveChangesAsync();
        return team;
    }

    public static async Task<Player> AddPlayerAsync(
        this ApplicationDbContext db,
        int teamId,
        string firstName = "Jan",
        string lastName = "Kowalski",
        string position = "Midfielder",
        DateOnly? archivedAt = null,
        string? photoUrl = null)
    {
        var player = new Player
        {
            FirstName = firstName,
            LastName = lastName,
            Position = position,
            DateOfBirth = new DateOnly(2000, 1, 1),
            TeamId = teamId,
            ArchivedAt = archivedAt,
            PhotoUrl = photoUrl
        };
        db.Players.Add(player);
        await db.SaveChangesAsync();
        return player;
    }

    public static async Task<Match> AddMatchAsync(
        this ApplicationDbContext db,
        int teamId,
        string season = "2025/26",
        string status = "Played",
        string opponent = "Rival FC",
        int? scoreFor = 1,
        int? scoreAgainst = 0,
        DateOnly? date = null,
        string? opponentLogoUrl = null)
    {
        var match = new Match
        {
            TeamId = teamId,
            Season = season,
            Status = status,
            Opponent = opponent,
            ScoreFor = scoreFor,
            ScoreAgainst = scoreAgainst,
            Date = date ?? new DateOnly(2025, 9, 1),
            OpponentLogoUrl = opponentLogoUrl
        };
        db.Matches.Add(match);
        await db.SaveChangesAsync();
        return match;
    }

    public static async Task<MatchAppearance> AddAppearanceAsync(
        this ApplicationDbContext db, int matchId, int playerId, bool isStarting = true, string? position = null)
    {
        var appearance = new MatchAppearance
        {
            MatchId = matchId,
            PlayerId = playerId,
            IsStarting = isStarting,
            Position = position
        };
        db.MatchAppearances.Add(appearance);
        await db.SaveChangesAsync();
        return appearance;
    }

    public static async Task<MatchEvent> AddEventAsync(
        this ApplicationDbContext db,
        int matchId,
        string eventType,
        int? playerId = null,
        int? minute = null,
        string team = "Us")
    {
        var matchEvent = new MatchEvent
        {
            MatchId = matchId,
            EventType = eventType,
            PlayerId = playerId,
            Minute = minute,
            Team = team
        };
        db.MatchEvents.Add(matchEvent);
        await db.SaveChangesAsync();
        return matchEvent;
    }

    public static async Task<ApplicationUser> AddUserAsync(
        this ApplicationDbContext db,
        string id,
        string? fullName = null,
        string? email = null,
        int? teamId = null)
    {
        var user = new ApplicationUser
        {
            Id = id,
            UserName = id,
            Email = email,
            FullName = fullName,
            TeamId = teamId
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return user;
    }

    public static async Task<Report> AddReportAsync(
        this ApplicationDbContext db,
        string authorId,
        string title = "Report",
        string content = "Content",
        string priority = "Normal",
        int? playerId = null,
        int? teamId = null,
        int? matchId = null,
        DateTime? createdAt = null)
    {
        var report = new Report
        {
            Title = title,
            Content = content,
            Priority = priority,
            PlayerId = playerId,
            TeamId = teamId,
            MatchId = matchId,
            CreatedByUserId = authorId,
            CreatedAt = createdAt ?? DateTime.UtcNow
        };
        db.Reports.Add(report);
        await db.SaveChangesAsync();
        return report;
    }

    public static async Task<TacticalScheme> AddSchemeAsync(
        this ApplicationDbContext db,
        string authorId,
        string name = "Scheme",
        string data = "{}",
        int? matchId = null,
        int? reportId = null,
        DateTime? createdAt = null)
    {
        var created = createdAt ?? DateTime.UtcNow;
        var scheme = new TacticalScheme
        {
            Name = name,
            Data = data,
            MatchId = matchId,
            ReportId = reportId,
            CreatedByUserId = authorId,
            CreatedAt = created,
            UpdatedAt = created
        };
        db.TacticalSchemes.Add(scheme);
        await db.SaveChangesAsync();
        return scheme;
    }
}
