using CoachHub.Api.Models;
using CoachHub.Api.Services;
using CoachHub.Api.Data;
using CoachHub.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Text.Json;

namespace CoachHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = $"{Roles.Coach}, {Roles.AssistantCoach}, {Roles.Analyst}")]
public class TacticalSchemesController : ControllerBase
{
    private const int MaxNameLength = 100;
    private const int MaxDataLength = 100_000;

    private readonly ITacticalSchemeService _tacticalSchemeService;
    private readonly IMatchService _matchService;

    public TacticalSchemesController(ITacticalSchemeService tacticalSchemeService, IMatchService matchService)
    {
        _tacticalSchemeService = tacticalSchemeService;
        _matchService = matchService;
    }

    private bool IsCallersTeam(int teamId)
    {
        var callerTeamId = User.FindFirstValue("teamId");
        return callerTeamId is not null && int.Parse(callerTeamId) == teamId;
    }

    private static string? ValidateRequest(TacticalSchemeRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name)) return "Nazwa tablicy jest wymagana.";
        if (request.Name.Length > MaxNameLength) return $"Nazwa tablicy nie może przekraczać {MaxNameLength} znaków.";
        if (request.Data.Length > MaxDataLength) return "Tablica jest zbyt duża.";

        try
        {
            using var document = JsonDocument.Parse(request.Data);
            if (document.RootElement.ValueKind != JsonValueKind.Object) return "Dane tablicy muszą być obiektem JSON.";
        }
        catch (JsonException)
        {
            return "Dane tablicy nie są poprawnym JSON-em.";
        }
        
        return null;
    }

    [HttpGet("match/{matchId}")]
    public async Task<ActionResult<List<TacticalSchemeSummary>>> GetByMatchId(int matchId)
    {
        var match = await _matchService.GetByIdAsync(matchId);
        if (match is null || !IsCallersTeam(match.TeamId)) return Forbid();
        
        return await _tacticalSchemeService.GetByMatchIdAsync(matchId);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TacticalSchemeSummary>> GetById(int id)
    {
        var scheme = await _tacticalSchemeService.GetByIdAsync(id);
        if (scheme is null) return NotFound();

        var match = await _matchService.GetByIdAsync(scheme.MatchId);
        if (match is null || !IsCallersTeam(match.TeamId)) return Forbid();

        return scheme;
    }

    [HttpPost("match/{matchId}")]
    [Authorize(Roles = $"{Roles.Coach}, {Roles.AssistantCoach}")]
    public async Task<ActionResult<TacticalSchemeSummary>> Create(int matchId, TacticalSchemeRequest request)
    {
        var match = await _matchService.GetByIdAsync(matchId);
        if (match is null || !IsCallersTeam(match.TeamId)) return Forbid();

        if (match.Status != "Planned")
            return BadRequest(new[] { "Tablicę można dodawać tylko do zaplanowanego meczu." });

        var error = ValidateRequest(request);
        if (error is not null) return BadRequest(new[] { error });

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null) return Forbid();

        var created = await _tacticalSchemeService.CreateAsync(new TacticalScheme
        {
            Name = request.Name,
            Data = request.Data,
            MatchId = matchId,
            CreatedByUserId = userId
        });

        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = $"{Roles.Coach}, {Roles.AssistantCoach}")]
    public async Task<IActionResult> Update(int id, TacticalSchemeRequest request)
    {
        var existing = await _tacticalSchemeService.GetByIdAsync(id);
        if (existing is null) return NotFound();
        
        var match = await _matchService.GetByIdAsync(existing.MatchId);
        if (match is null || !IsCallersTeam(match.TeamId)) return Forbid();

        var error = ValidateRequest(request);
        if (error is not null) return BadRequest(new[] { error });

        var success = await _tacticalSchemeService.UpdateAsync(id, request);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = Roles.Coach)]
    public async Task<IActionResult> Delete(int id)
    {
        var existing = await _tacticalSchemeService.GetByIdAsync(id);
        if (existing is null) return NotFound();

        var match = await _matchService.GetByIdAsync(existing.MatchId);
        if (match is null || !IsCallersTeam(match.TeamId)) return Forbid();

        var success = await _tacticalSchemeService.DeleteAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }
}