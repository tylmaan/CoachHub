using CoachHub.Api.Models;
using CoachHub.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace CoachHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
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
        return await _teamService.GetAllAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Team>> GetById(int id)
    {
        var team = await _teamService.GetByIdAsync(id);
        if (team is null) return NotFound();
        return team;
    }

    [HttpPost]
    public async Task<ActionResult<Team>> Create(Team team)
    {
        var created = await _teamService.CreateAsync(team);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, Team team)
    {
        var success = await _teamService.UpdateAsync(id, team);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var success = await _teamService.DeleteAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }
}