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
public class CareerHistoryEntriesController : ControllerBase
{
    private readonly ICareerHistoryEntryService _careerHistoryEntryService;
    private readonly IPlayerService _playerService;
    
    public CareerHistoryEntriesController(ICareerHistoryEntryService careerHistoryEntryService, IPlayerService playerService)
    {
        _careerHistoryEntryService = careerHistoryEntryService;
        _playerService = playerService;
    }

    [HttpGet]
    public async Task<ActionResult<List<CareerHistoryEntry>>> GetAll()
    {
        var callerTeamId = User.FindFirstValue("teamId");
        if (callerTeamId is null) return Ok(new List<CareerHistoryEntry>());

        var teamPlayerIds = (await _playerService.GetAllAsync())
            .Where(p => p.TeamId == int.Parse(callerTeamId))
            .Select(p => p.Id)
            .ToHashSet();
        
        var allEntries = await _careerHistoryEntryService.GetAllAsync();
        return allEntries.Where(e => teamPlayerIds.Contains(e.PlayerId)).ToList();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CareerHistoryEntry>> GetById(int id)
    {
        var entry = await _careerHistoryEntryService.GetByIdAsync(id);
        if (entry is null) return NotFound();
        
        var player = await _playerService.GetByIdAsync(entry.PlayerId);
        var callerTeamId = User.FindFirstValue("teamId");
        if (player is null || callerTeamId is null || int.Parse(callerTeamId) != player.TeamId) return Forbid();
        
        return entry;
    }

    [HttpPost]
    [Authorize(Roles = $"{Roles.Coach}, {Roles.AssistantCoach}")]
    public async Task<ActionResult<CareerHistoryEntry>> Create(CareerHistoryEntry entry)
    {
        var player = await _playerService.GetByIdAsync(entry.PlayerId);
        var callerTeamId = User.FindFirstValue("teamId");
        if (player is null || callerTeamId is null || int.Parse(callerTeamId) != player.TeamId) return Forbid();
        
        var created = await _careerHistoryEntryService.CreateAsync(entry);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = $"{Roles.Coach}, {Roles.AssistantCoach}")]
    public async Task<IActionResult> Update(int id, CareerHistoryEntry entry)
    {
        var existing = await _careerHistoryEntryService.GetByIdAsync(id);
        if (existing is null) return NotFound();

        var callerTeamId = User.FindFirstValue("teamId");
        var existingPlayer = await _playerService.GetByIdAsync(existing.PlayerId);
        var newPlayer = await _playerService.GetByIdAsync(entry.PlayerId);
        if (existingPlayer is null || newPlayer is null || callerTeamId is null 
        || int.Parse(callerTeamId) != existingPlayer.TeamId
        || int.Parse(callerTeamId) != newPlayer.TeamId) return Forbid();
        
        var success = await _careerHistoryEntryService.UpdateAsync(id, entry);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = Roles.Coach)]
    public async Task<IActionResult> Delete(int id)
    {
        var existing = await _careerHistoryEntryService.GetByIdAsync(id);
        if (existing is null) return NotFound();

        var player = await _playerService.GetByIdAsync(existing.PlayerId);
        var callerTeamId = User.FindFirstValue("teamId");
        if (player is null || callerTeamId is null || int.Parse(callerTeamId) != player.TeamId) return Forbid();

        var success = await _careerHistoryEntryService.DeleteAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }
}