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
public class PlayerSeasonStatsController : ControllerBase
{
    private readonly IPlayerSeasonStatService _playerSeasonStatService;
    private readonly IPlayerService _playerService;

    public PlayerSeasonStatsController(IPlayerSeasonStatService playerSeasonStatService, IPlayerService playerService)
    {
        _playerSeasonStatService = playerSeasonStatService;
        _playerService = playerService;
    }

    [HttpGet]
    public async Task<ActionResult<List<PlayerSeasonStat>>> GetAll()
    {
        var callerTeamId = User.FindFirstValue("teamId");
        if (callerTeamId is null) return Ok(new List<PlayerSeasonStat>());

        var teamPlayerIds = (await _playerService.GetAllAsync())
            .Where(p => p.TeamId == int.Parse(callerTeamId))
            .Select(p => p.Id)
            .ToHashSet();

        var allStats = await _playerSeasonStatService.GetAllAsync();
        return allStats.Where(s => teamPlayerIds.Contains(s.PlayerId)).ToList();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PlayerSeasonStat>> GetById(int id)
    {
        var stat = await _playerSeasonStatService.GetByIdAsync(id);
        if (stat is null) return NotFound();
        
        var player = await _playerService.GetByIdAsync(stat.PlayerId);
        var callerTeamId = User.FindFirstValue("teamId");
        if (player is null || callerTeamId is null || int.Parse(callerTeamId) != player.TeamId) return Forbid();        
        
        return stat;
    }

    [HttpPost]
    [Authorize(Roles = $"{Roles.Coach}, {Roles.AssistantCoach}")]
    public async Task<ActionResult<PlayerSeasonStat>> Create(PlayerSeasonStat stat)
    {
        var player = await _playerService.GetByIdAsync(stat.PlayerId);
        var callerTeamId = User.FindFirstValue("teamId");
        if (player is null || callerTeamId is null || int.Parse(callerTeamId) != player.TeamId) return Forbid();
        
        var createdStat = await _playerSeasonStatService.CreateAsync(stat);
        return CreatedAtAction(nameof(GetById), new { id = createdStat.Id }, createdStat);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = $"{Roles.Coach}, {Roles.AssistantCoach}")]
    public async Task<IActionResult> Update(int id, PlayerSeasonStat stat)
    {
        var existing = await _playerSeasonStatService.GetByIdAsync(id);
        if (existing is null) return NotFound();

        var callerTeamId = User.FindFirstValue("teamId");
        var existingPlayer = await _playerService.GetByIdAsync(existing.PlayerId);
        var newPlayer = await _playerService.GetByIdAsync(stat.PlayerId);
        
        if (callerTeamId is null || existingPlayer is null || newPlayer is null 
        || int.Parse(callerTeamId) != existingPlayer.TeamId
        || int.Parse(callerTeamId) != newPlayer.TeamId) return Forbid();

        var success = await _playerSeasonStatService.UpdateAsync(id, stat);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = Roles.Coach)]
    public async Task<IActionResult> Delete(int id)
    {
        var existing = await _playerSeasonStatService.GetByIdAsync(id);
        if (existing is null) return NotFound();

        var player = await _playerService.GetByIdAsync(existing.PlayerId);
        var callerTeamId = User.FindFirstValue("teamId");
        if (player is null || callerTeamId is null || int.Parse(callerTeamId) != player.TeamId) return Forbid();
        
        var success = await _playerSeasonStatService.DeleteAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }
}