using CoachHub.Api.Models;
using CoachHub.Api.Services;
using CoachHub.Api.Data;
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

    public ReportsController(IReportService reportService, IPlayerService playerService)
    {
        _reportService = reportService;
        _playerService = playerService;
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
    public async Task<ActionResult<Report>> Create(Report report)
    {
        var callerTeamId = User.FindFirstValue("teamId");
        if (!await IsInCallerTeamAsync(report, callerTeamId)) return Forbid();
        
        var created = await _reportService.CreateReportAsync(report);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, Report report)
    {
        var existing = await _reportService.GetReportByIdAsync(id);
        if (existing is null) return NotFound();

        var callerTeamId = User.FindFirstValue("teamId");
        if (!await IsInCallerTeamAsync(existing, callerTeamId) || !await IsInCallerTeamAsync(report, callerTeamId))
        {
            return Forbid();
        }

        var success = await _reportService.UpdateReportAsync(id, report);
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