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
public class MatchEventsController : ControllerBase
{
    private readonly IMatchEventService _eventService;
    private readonly IMatchService _matchService;

    public MatchEventsController(IMatchEventService eventService, IMatchService matchService)
    {
        _eventService = eventService;
        _matchService = matchService;
    }

    [HttpGet("match/{matchId}")]
    public async Task<ActionResult<List<MatchEvent>>> GetByMatchId(int matchId)
    {
        var match = await _matchService.GetByIdAsync(matchId);
        var callerTeamId = User.FindFirstValue("teamId");
        if (match is null || callerTeamId is null || int.Parse(callerTeamId) != match.TeamId) return Forbid();

        return await _eventService.GetByMatchIdAsync(matchId);
    }

    [HttpPost]
    [Authorize(Roles = $"{Roles.Coach}, {Roles.AssistantCoach}")]
    public async Task<ActionResult<MatchEvent>> Create(MatchEvent matchEvent)
    {
        var match = await _matchService.GetByIdAsync(matchEvent.MatchId);
        var callerTeamId = User.FindFirstValue("teamId");
        if (match is null || callerTeamId is null || int.Parse(callerTeamId) != match.TeamId) return Forbid();
        
        var created = await _eventService.CreateAsync(matchEvent);
        return CreatedAtAction(nameof(GetByMatchId), new { matchId = created.MatchId }, created);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = $"{Roles.Coach}, {Roles.AssistantCoach}")]
    public async Task<IActionResult> Update(int id, MatchEvent matchEvent)
    {
        var existing = await _eventService.GetByIdAsync(id);
        if (existing is null) return NotFound();

        var match = await _matchService.GetByIdAsync(existing.MatchId);
        var callerTeamId = User.FindFirstValue("teamId");
        if (match is null || callerTeamId is null || int.Parse(callerTeamId) != match.TeamId) return Forbid();

        var success = await _eventService.UpdateAsync(id, matchEvent);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = Roles.Coach)]
    public async Task<IActionResult> Delete(int id)
    {
        var existing = await _eventService.GetByIdAsync(id);
        if (existing is null) return NotFound();

        var match = await _matchService.GetByIdAsync(existing.MatchId);
        var callerTeamId = User.FindFirstValue("teamId");
        if (match is null || callerTeamId is null || int.Parse(callerTeamId) != match.TeamId) return Forbid();

        var success = await _eventService.DeleteAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }
}