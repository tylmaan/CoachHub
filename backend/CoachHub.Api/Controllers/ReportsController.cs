using CoachHub.Api.Models;
using CoachHub.Api.Services;
using CoachHub.Api.Data;
using CoachHub.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CoachHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = $"{Roles.Coach}, {Roles.AssistantCoach}, {Roles.Analyst}")]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;
    private readonly IPlayerService _playerService;
    private readonly IMatchService _matchService;

    public ReportsController(IReportService reportService, IPlayerService playerService, IMatchService matchService)
    {
        _reportService = reportService;
        _playerService = playerService;
        _matchService = matchService;
    }

    private async Task<bool> IsInCallerTeamAsync(Report report, string? callerTeamId)
    {
        if (callerTeamId is null) return false;
        var teamId = int.Parse(callerTeamId);

        if (report.TeamId is not null) return report.TeamId == teamId;

        if (report.PlayerId is not null)
        {
            var player = await _playerService.GetByIdAsync(report.PlayerId.Value);
            return player is not null && player.TeamId == teamId;
        }

        return false;
    }

    private async Task<string?> ValidateRequestAsync(ReportRequest request, string? callerTeamId)
    {
        if (callerTeamId is null) return "Brak drużyny.";
        var teamId = int.Parse(callerTeamId);

        if (string.IsNullOrWhiteSpace(request.Title) || request.Title.Length > 200) 
            return "Tytuł jest wymagany (max 200 znaków).";
        if (string.IsNullOrWhiteSpace(request.Content)) 
            return "Treść raportu jest wymagana.";
        if ((request.PlayerId is null) == (request.TeamId is null))
            return "Raport musi dotyczyć zawodnika albo drużyny.";

        if (request.TeamId is not null && request.TeamId != teamId) 
            return "Nieprawidłowa drużyna.";

        if (request.PlayerId is not null)
        {
            var player = await _playerService.GetByIdAsync(request.PlayerId.Value);
            if (player is null || player.TeamId != teamId) 
                return "Nieprawidłowy zawodnik.";
        }

        if (request.MatchId is not null)
        {
            var match = await _matchService.GetByIdAsync(request.MatchId.Value);
            if (match is null || match.TeamId != teamId) 
                return "Nieprawidłowy mecz.";
        }

        return null;
    }

    private void ApplyPermissions(IEnumerable<ReportSummary> summaries)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isCoach = User.IsInRole(Roles.Coach);
        foreach (var summary in summaries)
        {
            summary.CanEdit = isCoach || summary.AuthorId == userId;
        }
    }

    [HttpGet]
    public async Task<ActionResult<List<ReportSummary>>> GetAll()
    {
        var callerTeamId = User.FindFirstValue("teamId");
        if (callerTeamId is null) return Ok(new List<ReportSummary>());

        var summaries = await _reportService.GetSummariesForTeamAsync(int.Parse(callerTeamId));
        ApplyPermissions(summaries);
        return summaries;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Report>> GetById(int id)
    {
        var report = await _reportService.GetReportByIdAsync(id);
        if (report is null) return NotFound();

        var callerTeamId = User.FindFirstValue("teamId");
        if (!await IsInCallerTeamAsync(report, callerTeamId)) return Forbid();

        return report;
    }

    [HttpGet("player/{playerId}")]
    public async Task<ActionResult<IEnumerable<Report>>> GetByPlayerId(int playerId)
    {
        var player = await _playerService.GetByIdAsync(playerId);
        var callerTeamId = User.FindFirstValue("teamId");
        if (player is null || callerTeamId is null || int.Parse(callerTeamId) != player.TeamId) return Forbid();
        
        return Ok(await _reportService.GetReportsByPlayerIdAsync(playerId));
    }

    [HttpGet("team/{teamId}")]
    public async Task<ActionResult<IEnumerable<Report>>> GetByTeamId(int teamId)
    {
        var callerTeamId = User.FindFirstValue("teamId");
        if (callerTeamId is null || int.Parse(callerTeamId) != teamId) return Forbid();
        
        return Ok(await _reportService.GetReportsByTeamIdAsync(teamId));
    }

    [HttpGet("user/{userId}")]
    public async Task<ActionResult<IEnumerable<Report>>> GetByUserId(string userId)
    {
        var callerTeamId = User.FindFirstValue("teamId");
        var reports = await _reportService.GetReportsByUserIdAsync(userId);

        var results = new List<Report>();
        foreach (var report in reports)
        {
            if (await IsInCallerTeamAsync(report, callerTeamId))
            {
                results.Add(report);
            }
        }
        
        return Ok(results);
    }
    
    [HttpPost]
    public async Task<ActionResult<Report>> Create(ReportRequest request)
    {
        var callerTeamId = User.FindFirstValue("teamId");
        var error = await ValidateRequestAsync(request, callerTeamId);
        if (error is not null) return BadRequest(new[] { error });

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null) return Forbid();

        var created = await _reportService.CreateReportAsync(new Report
        {
            Title = request.Title,
            Content = request.Content,
            PlayerId = request.PlayerId,
            TeamId = request.TeamId,
            MatchId = request.MatchId,
            CreatedByUserId = userId
        });

        var summary = await _reportService.GetSummaryByIdAsync(created.Id);
        if (summary is not null) ApplyPermissions(new[] { summary });
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, summary);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, ReportRequest request)
    {
        var existing = await _reportService.GetReportByIdAsync(id);
        if (existing is null) return NotFound();

        var callerTeamId = User.FindFirstValue("teamId");
        if (!await IsInCallerTeamAsync(existing, callerTeamId)) return Forbid();

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (existing.CreatedByUserId != userId && !User.IsInRole(Roles.Coach)) return Forbid();

        var error = await ValidateRequestAsync(request, callerTeamId);
        if (error is not null) return BadRequest(new[] { error });

        var success = await _reportService.UpdateReportAsync(id, new Report
        {
            Title = request.Title,
            Content = request.Content,
            PlayerId = request.PlayerId,
            TeamId = request.TeamId,
            MatchId = request.MatchId,
            CreatedByUserId = existing.CreatedByUserId
        });
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = Roles.Coach)]
    public async Task<IActionResult> Delete(int id)
    {
        var existing = await _reportService.GetReportByIdAsync(id);
        if (existing is null) return NotFound();

        var callerTeamId = User.FindFirstValue("teamId");
        if (!await IsInCallerTeamAsync(existing, callerTeamId)) return Forbid();
        
        var success = await _reportService.DeleteReportAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }
}    