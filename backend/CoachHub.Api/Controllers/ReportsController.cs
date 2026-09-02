using CoachHub.Api.Models;
using CoachHub.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace CoachHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Report>> GetById(int id)
    {
        var report = await _reportService.GetReportByIdAsync(id);
        if (report is null) return NotFound();
        return report;
    }

    [HttpGet("player/{playerId}")]
    public async Task<ActionResult<IEnumerable<Report>>> GetByPlayerId(int playerId)
    {
        return Ok(await _reportService.GetReportsByPlayerIdAsync(playerId));
    }

    [HttpGet("team/{teamId}")]
    public async Task<ActionResult<IEnumerable<Report>>> GetByTeamId(int teamId)
    {
        return Ok(await _reportService.GetReportsByTeamIdAsync(teamId));
    }

    [HttpGet("user/{userId}")]
    public async Task<ActionResult<IEnumerable<Report>>> GetByUserId(string userId)
    {
        return Ok(await _reportService.GetReportsByUserIdAsync(userId));
    }
    
    [HttpPost]
    public async Task<ActionResult<Report>> Create(Report report)
    {
        var created = await _reportService.CreateReportAsync(report);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, Report report)
    {
        var success = await _reportService.UpdateReportAsync(id, report);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var success = await _reportService.DeleteReportAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }
}    