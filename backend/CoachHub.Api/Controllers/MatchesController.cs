using CoachHub.Api.Data;
using CoachHub.Api.Models;
using CoachHub.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace CoachHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = $"{Roles.Coach}, {Roles.AssistantCoach}, {Roles.Analyst}")]
public class MatchesController : ControllerBase
{
    private readonly IMatchService _matchservice;

    public MatchesController(IMatchService matchService)
    {
        _matchservice = matchService;
    }

    [HttpGet]
    public async Task<ActionResult<List<Match>>> GetAll()
    {
        var callerTeamId = User.FindFirstValue("teamId");
        if (callerTeamId is null) return Ok(new List<Match>());

        var allMatches = await _matchservice.GetAllAsync();
        return allMatches.Where(m => m.TeamId == int.Parse(callerTeamId)).ToList();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Match>> GetById(int id)
    {
        var match = await _matchservice.GetByIdAsync(id);
        if (match is null) return NotFound();

        var callerTeamId = User.FindFirstValue("teamId");
        if (callerTeamId is null || int.Parse(callerTeamId) != match.TeamId) return Forbid();

        return match;
    }

    [HttpPost]
    [Authorize(Roles = $"{Roles.Coach}, {Roles.AssistantCoach}")]
    public async Task<ActionResult<Match>> Create(Match match)
    {
        var callerTeamId = User.FindFirstValue("teamId");
        if (callerTeamId is null || int.Parse(callerTeamId) != match.TeamId) return Forbid();

        var created = await _matchservice.CreateAsync(match);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = $"{Roles.Coach}, {Roles.AssistantCoach}")]
    public async Task<IActionResult> Update(int id, Match match)
    {
        var existing = await _matchservice.GetByIdAsync(id);
        if (existing is null) return NotFound();

        var callerTeamId = User.FindFirstValue("teamId");
        if (callerTeamId is null || int.Parse(callerTeamId) != existing.TeamId) return Forbid();

        var success = await _matchservice.UpdateAsync(id, match);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = Roles.Coach)]
    public async Task<IActionResult> Delete(int id)
    {
        var existing = await _matchservice.GetByIdAsync(id);
        if (existing is null) return NotFound();

        var callerTeamId = User.FindFirstValue("teamId");
        if (callerTeamId is null || int.Parse(callerTeamId) != existing.TeamId) return Forbid();
        
        var success = await _matchservice.DeleteAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }
}