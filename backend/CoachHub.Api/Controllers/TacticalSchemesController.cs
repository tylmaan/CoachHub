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
public class TacticalSchemesController : ControllerBase
{
    private readonly ITacticalSchemeService _tacticalSchemeService;

    public TacticalSchemesController(ITacticalSchemeService tacticalSchemeService)
    {
        _tacticalSchemeService = tacticalSchemeService;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TacticalScheme>> GetById(int id)
    {
        var tacticalScheme = await _tacticalSchemeService.GetTacticalSchemeByIdAsync(id);
        if (tacticalScheme is null) return NotFound();
        
        var callerTeamId = User.FindFirstValue("teamId");
        if (callerTeamId is null || int.Parse(callerTeamId) != tacticalScheme.TeamId) return Forbid();       

        return tacticalScheme;
    }

    [HttpGet("team/{teamId}")]
    public async Task<ActionResult<IEnumerable<TacticalScheme>>> GetByTeamId(int teamId)
    {
        var callerTeamId = User.FindFirstValue("teamId");
        if (callerTeamId is null || int.Parse(callerTeamId) != teamId) return Forbid();

        return Ok(await _tacticalSchemeService.GetTacticalSchemesByTeamIdAsync(teamId));
    }

    [HttpPost]
    [Authorize(Roles = $"{Roles.Coach}, {Roles.AssistantCoach}")]
    public async Task<ActionResult<TacticalScheme>> Create(TacticalScheme tacticalScheme)
    {
        var callerTeamId = User.FindFirstValue("teamId");
        if (callerTeamId is null || int.Parse(callerTeamId) != tacticalScheme.TeamId) return Forbid();

        var created = await _tacticalSchemeService.CreateTacticalSchemeAsync(tacticalScheme);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = $"{Roles.Coach}, {Roles.AssistantCoach}")]
    public async Task<IActionResult> Update(int id, TacticalScheme tacticalScheme)
    {
        var existing = await _tacticalSchemeService.GetTacticalSchemeByIdAsync(id);
        if (existing is null) return NotFound();
        
        var callerTeamId = User.FindFirstValue("teamId");
        if (callerTeamId is null || int.Parse(callerTeamId) != existing.TeamId) return Forbid();
        
        var success = await _tacticalSchemeService.UpdateTacticalSchemeAsync(id, tacticalScheme);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = Roles.Coach)]
    public async Task<IActionResult> Delete(int id)
    {
        var existing = await _tacticalSchemeService.GetTacticalSchemeByIdAsync(id);
        if (existing is null) return NotFound();

        var callerTeamId = User.FindFirstValue("teamId");
        if (callerTeamId is null || int.Parse(callerTeamId) != existing.TeamId) return Forbid();

        var success = await _tacticalSchemeService.DeleteTacticalSchemeAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }
}