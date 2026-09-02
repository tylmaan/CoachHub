using CoachHub.Api.Models;
using CoachHub.Api.Services;
using CoachHub.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CoachHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = $"{Roles.Coach}, {Roles.AssistantCoach}, {Roles.Analyst}")]
public class PlayerSeasonStatsController : ControllerBase
{
    private readonly IPlayerSeasonStatService _playerSeasonStatService;

    public PlayerSeasonStatsController(IPlayerSeasonStatService playerSeasonStatService)
    {
        _playerSeasonStatService = playerSeasonStatService;
    }

    [HttpGet]
    public async Task<ActionResult<List<PlayerSeasonStat>>> GetAll()
    {
        return await _playerSeasonStatService.GetAllAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PlayerSeasonStat>> GetById(int id)
    {
        var stat = await _playerSeasonStatService.GetByIdAsync(id);
        if (stat is null) return NotFound();
        return stat;
    }

    [HttpPost]
    [Authorize(Roles = $"{Roles.Coach}, {Roles.AssistantCoach}")]
    public async Task<ActionResult<PlayerSeasonStat>> Create(PlayerSeasonStat stat)
    {
        var createdStat = await _playerSeasonStatService.CreateAsync(stat);
        return CreatedAtAction(nameof(GetById), new { id = createdStat.Id }, createdStat);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = $"{Roles.Coach}, {Roles.AssistantCoach}")]
    public async Task<IActionResult> Update(int id, PlayerSeasonStat stat)
    {
        var success = await _playerSeasonStatService.UpdateAsync(id, stat);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = Roles.Coach)]
    public async Task<IActionResult> Delete(int id)
    {
        var success = await _playerSeasonStatService.DeleteAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }
}