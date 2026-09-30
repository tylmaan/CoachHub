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
public class MatchAppearancesController: ControllerBase
{
    private readonly IMatchAppearanceService _appearanceService;
    private readonly IMatchService _matchService;

    public MatchAppearancesController(IMatchAppearanceService appearanceService, IMatchService matchService)
    {
        _appearanceService = appearanceService;
        _matchService = matchService;
    }

    [HttpGet("match/{matchId}")]
    public async Task<ActionResult<List<MatchAppearance>>> GetByMatchId(int matchId)
    {
        var match = await _matchService.GetByIdAsync(matchId);
        var callerTeamId = User.FindFirstValue("teamId");
        if (match is null || callerTeamId is null || int.Parse(callerTeamId) != match.TeamId) return Forbid();

        return await _appearanceService.GetByMatchIdAsync(matchId);
    }

    [HttpPost]
    [Authorize(Roles = $"{Roles.Coach}, {Roles.AssistantCoach}")]
    public async Task<ActionResult<MatchAppearance>> Create(MatchAppearance appearance)
    {
        var match = await _matchService.GetByIdAsync(appearance.MatchId);
        var callerTeamId = User.FindFirstValue("teamId");
        if (match is null || callerTeamId is null || int.Parse(callerTeamId) != match.TeamId) return Forbid();

        var created = await _appearanceService.CreateAsync(appearance);
        return CreatedAtAction(nameof(GetByMatchId), new { matchId = created.MatchId }, created);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = $"{Roles.Coach}, {Roles.AssistantCoach}")]
    public async Task<IActionResult> Update(int id, MatchAppearance appearance)
    {
        var existing = await _appearanceService.GetByIdAsync(id);
        if (existing is null) return NotFound();

        var match = await _matchService.GetByIdAsync(existing.MatchId);
        var callerTeamId = User.FindFirstValue("teamId");
        if (match is null || callerTeamId is null || int.Parse(callerTeamId) != match.TeamId) return Forbid();

        var success = await _appearanceService.UpdateAsync(id, appearance);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = Roles.Coach)]
    public async Task<IActionResult> Delete(int id)
    {
        var existing = await _appearanceService.GetByIdAsync(id);
        if (existing is null) return NotFound();

        var match = await _matchService.GetByIdAsync(existing.MatchId);
        var callerTeamId = User.FindFirstValue("teamId");
        if (match is null || callerTeamId is null || int.Parse(callerTeamId) != match.TeamId) return Forbid();

        var success = await _appearanceService.DeleteAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }
}