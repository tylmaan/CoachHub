using CoachHub.Api.Data;
using CoachHub.Api.DTOs;
using CoachHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CoachHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = $"{Roles.Coach}, {Roles.AssistantCoach}, {Roles.Analyst}")]
public class TeamStatsController : ControllerBase
{
    private readonly ITeamStatsService _teamStatsService;

    public TeamStatsController(ITeamStatsService teamStatsService)
    {
        _teamStatsService = teamStatsService;
    }

    [HttpGet]
    public async Task<ActionResult<List<TeamSeasonStats>>> GetAll()
    {
        var callerTeamId = User.FindFirstValue("teamId");
        if (callerTeamId is null) return Ok(new List<TeamSeasonStats>());

        var stats = await _teamStatsService.GetStatsForTeamAsync(int.Parse(callerTeamId));
        return Ok(stats);
    }
}