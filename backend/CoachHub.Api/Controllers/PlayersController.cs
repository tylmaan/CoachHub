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
public class PlayersController : ControllerBase
{
    private readonly IPlayerService _playerService;

    public PlayersController(IPlayerService playerService)
    {
        _playerService = playerService;
    }

    [HttpGet]
    public async Task<ActionResult<List<Player>>> GetAll()
    {
        var callerTeamId = User.FindFirstValue("teamId");
        if (callerTeamId is null) return Ok(new List<Player>());

        var allPlayers = await _playerService.GetAllAsync();
        return allPlayers.Where(p => p.TeamId == int.Parse(callerTeamId)).ToList();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Player>> GetById(int id)
    {
        var player = await _playerService.GetByIdAsync(id);
        if (player is null) return NotFound();

        var callerTeamId = User.FindFirstValue("teamId");
        if (callerTeamId is null || player.TeamId != int.Parse(callerTeamId)) return Forbid();

        return player;
    }

    [HttpPost]
    [Authorize(Roles = $"{Roles.Coach}, {Roles.AssistantCoach}")]
    public async Task<ActionResult<Player>> Create(Player player)
    {
        var callerTeamId = User.FindFirstValue("teamId");
        if (callerTeamId is null || player.TeamId != int.Parse(callerTeamId)) return Forbid();

        var created = await _playerService.CreateAsync(player);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = $"{Roles.Coach}, {Roles.AssistantCoach}")]
    public async Task<IActionResult> Update(int id, Player player)
    {
        var existing = await _playerService.GetByIdAsync(id);
        if (existing is null) return NotFound();

        var callerTeamId = User.FindFirstValue("teamId");
        if (callerTeamId is null || int.Parse(callerTeamId) != existing.TeamId || int.Parse(callerTeamId) != player.TeamId) return Forbid();

        var success = await _playerService.UpdateAsync(id, player);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = Roles.Coach)]
    public async Task<IActionResult> Delete(int id)
    {
        var existing = await _playerService.GetByIdAsync(id);
        if (existing is null) return NotFound();

        var callerTeamId = User.FindFirstValue("teamId");
        if (callerTeamId is null || int.Parse(callerTeamId) != existing.TeamId) return Forbid();

        var success = await _playerService.DeleteAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }
}