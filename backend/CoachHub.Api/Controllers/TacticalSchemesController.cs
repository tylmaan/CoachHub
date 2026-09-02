using CoachHub.Api.Models;
using CoachHub.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace CoachHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
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
        return tacticalScheme;
    }

    [HttpGet("team/{teamId}")]
    public async Task<ActionResult<IEnumerable<TacticalScheme>>> GetByTeamId(int teamId)
    {
        return Ok(await _tacticalSchemeService.GetTacticalSchemesByTeamIdAsync(teamId));
    }

    [HttpPost]
    public async Task<ActionResult<TacticalScheme>> Create(TacticalScheme tacticalScheme)
    {
        var created = await _tacticalSchemeService.CreateTacticalSchemeAsync(tacticalScheme);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, TacticalScheme tacticalScheme)
    {
        var success = await _tacticalSchemeService.UpdateTacticalSchemeAsync(id, tacticalScheme);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var success = await _tacticalSchemeService.DeleteTacticalSchemeAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }
}