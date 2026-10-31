using CoachHub.Api.Models;
using CoachHub.Api.Services;
using CoachHub.Api.Data;
using CoachHub.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;

namespace CoachHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = $"{Roles.Admin}, {Roles.Coach}, {Roles.AssistantCoach}, {Roles.Analyst}")]
public class TeamsController : ControllerBase
{
    private readonly ITeamService _teamService;
    private readonly UserManager<ApplicationUser> _userManager;

    public TeamsController(ITeamService teamService, UserManager<ApplicationUser> userManager)
    {
        _teamService = teamService;
        _userManager = userManager;
    }

    private static readonly string[] KitPatterns =
    {
        "Solid",
        "HorizontalStripes",
        "VerticalStripes",
        "Halves",
        "Sash",
        "Quarters",
    };
    
    private static readonly System.Text.RegularExpressions.Regex HexColor = new(@"^#([0-9A-Fa-f]{6})$");
    private static readonly System.Text.RegularExpressions.Regex CountryCodePattern = new(@"^[a-z]{2}$");

    private static bool HasValidCountry(Team team)=>
        team.CountryCode is null || CountryCodePattern.IsMatch(team.CountryCode);

    private static bool IsValidKit(Kit kit) =>
        KitPatterns.Contains(kit.Pattern)
        && HexColor.IsMatch(kit.PrimaryColor)
        && HexColor.IsMatch(kit.SecondaryColor);

    private static bool HasValidKits(Team team) =>
        IsValidKit(team.HomeKit)
        && IsValidKit(team.AwayKit)
        && IsValidKit(team.GoalkeeperKit);

    [HttpGet]
    public async Task<ActionResult<List<TeamSummary>>> GetAll()
    {
        List<Team> teams;
        if (User.IsInRole(Roles.Admin))
        {
            teams = await _teamService.GetAllAsync();
        }
        else
        {
            var callerTeamId = User.FindFirstValue("teamId");
            if (callerTeamId is null) return Ok(new List<TeamSummary>());

            var allTeams = await _teamService.GetAllAsync();
            teams = allTeams.Where(t => t.Id == int.Parse(callerTeamId)).ToList();
        }

        var result = new List<TeamSummary>();
        foreach (var team in teams)
        {
            var staff = new List<UserSummary>();
            foreach (var user in _userManager.Users.Where(u => u.TeamId == team.Id).ToList())
            {
                var roles = await _userManager.GetRolesAsync(user);
                staff.Add(new UserSummary
                {
                    Id = user.Id,
                    Email = user.Email!,
                    Roles = roles.ToList(),
                    TeamId = user.TeamId,
                    FullName = user.FullName,
                    PhotoUrl = user.PhotoUrl
                });
            }

            result.Add(new TeamSummary
            {
                Id = team.Id,
                Name = team.Name,
                CountryCode = team.CountryCode,
                LogoUrl = team.LogoUrl,
                HomeKit = team.HomeKit,
                AwayKit = team.AwayKit,
                GoalkeeperKit = team.GoalkeeperKit,
                StaffMembers = staff
            });
        }
        return result;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Team>> GetById(int id)
    {
        if (!User.IsInRole(Roles.Admin))
        {
            var callerTeamId = User.FindFirstValue("teamId");
            if (callerTeamId is null || int.Parse(callerTeamId) != id) return Forbid();
        }

        var team = await _teamService.GetByIdAsync(id);
        if (team is null) return NotFound();
        return team;
    }

    [HttpPost]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<Team>> Create(Team team)
    {
        if (!HasValidCountry(team))
            return BadRequest(new[] { "Nieprawidłowy kod kraju." });

        if (!HasValidKits(team))
            return BadRequest(new[] { "Nieprawidłowy wzór lub kolor koszulki." });

        var created = await _teamService.CreateAsync(team);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Update(int id, Team team)
    {
        if (!HasValidCountry(team))
            return BadRequest(new[] { "Nieprawidłowy kod kraju." });

        if (!HasValidKits(team))
            return BadRequest(new[] { "Nieprawidłowy wzór lub kolor koszulki." });
            
        var success = await _teamService.UpdateAsync(id, team);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Delete(int id)
    {
        var success = await _teamService.DeleteAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }
}