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
public class TeamsController : ControllerBase
{
    private readonly ITeamService _teamService;

    public TeamsController(ITeamService teamService)
    {
        _teamService = teamService;
    }

    [HttpGet]
    public async Task<ActionResult<List<Team>>> GetAll()
    {
        var callerTeamId = User.FindFirstValue("teamId");
        if (callerTeamId is null) return Ok(new List<Team>());

        var allTeams = await _teamService.GetAllAsync();
        return allTeams.Where(t => t.Id == int.Parse(callerTeamId)).ToList();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Team>> GetById(int id)
    {
        var callerTeamId = User.FindFirstValue("teamId");
        if (callerTeamId is null || int.Parse(callerTeamId) != id) return Forbid();

        var team = await _teamService.GetByIdAsync(id);
        if (team is null) return NotFound();
        return team;
    }

    [HttpPost]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<Team>> Create(Team team)
    {
        var created = await _teamService.CreateAsync(team);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = $"{Roles.Coach}, {Roles.AssistantCoach}")]
    public async Task<IActionResult> Update(int id, Team team)
    {
        var callerTeamId = User.FindFirstValue("teamId");
        if (callerTeamId is null || int.Parse(callerTeamId) != id) return Forbid();

        var success = await _teamService.UpdateAsync(id, team);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = Roles.Coach)]
    public async Task<IActionResult> Delete(int id)
    {
        var callerTeamId = User.FindFirstValue("teamId");
        if (callerTeamId is null || int.Parse(callerTeamId) != id) return Forbid();

        var success = await _teamService.DeleteAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }
}