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
public class PlayerStatsController : ControllerBase
{
    private readonly IPlayerStatsService _playerStatsService;

    public PlayerStatsController(IPlayerStatsService playerStatsService)
    {
        _playerStatsService = playerStatsService;
    }

    [HttpGet]
    public async Task<ActionResult<List<PlayerSeasonStats>>> GetAll()
    {
        var callerTeamId = User.FindFirstValue("teamId");
        if (callerTeamId is null) return Ok(new List<PlayerSeasonStats>());

        var stats = await _playerStatsService.GetStatsForTeamAsync(int.Parse(callerTeamId));
        return Ok(stats);
    }
}