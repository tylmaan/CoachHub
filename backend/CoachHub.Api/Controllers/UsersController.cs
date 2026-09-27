using System.Runtime.CompilerServices;
using CoachHub.Api.Data;
using CoachHub.Api.DTOs;
using CoachHub.Api.Models;
using CoachHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace CoachHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = Roles.Admin)]
public class UsersController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ITeamService _teamService;

    public UsersController(UserManager<ApplicationUser> userManager, ITeamService teamService)
    {
        _userManager = userManager;
        _teamService = teamService;
    }

    [HttpGet]
    public async Task<ActionResult<List<UserSummary>>> GetAll()
    {
        var result = new List<UserSummary>();

        foreach (var user in _userManager.Users.ToList())
        {
            var roles = await _userManager.GetRolesAsync(user);
            if (roles.Contains(Roles.Admin)) continue;

            result.Add(new UserSummary
            {
                Id = user.Id,
                Email = user.Email!,
                Roles = roles.ToList(),
                TeamId = user.TeamId,
                FullName = user.FullName
            });
        }

        return result;
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, UpdateUserRequest request)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user is null) return NotFound();

        var currentRoles = await _userManager.GetRolesAsync(user);
        if (currentRoles.Contains(Roles.Admin)) return Forbid();

        if (!Roles.All.Contains(request.Role) || request.Role == Roles.Admin)
        {
            return BadRequest($"Nieprawidłowa rola. Dozwolone role: {string.Join(", ", Roles.All)}");
        }

        var team = await _teamService.GetByIdAsync(request.TeamId);
        if (team is null) return BadRequest("Nie znaleziono drużyny.");

        await _userManager.RemoveFromRolesAsync(user, currentRoles);
        await _userManager.AddToRoleAsync(user, request.Role);
        user.TeamId = request.TeamId;
        user.FullName = request.FullName;
        await _userManager.UpdateAsync(user);

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user is null) return NotFound();

        var roles = await _userManager.GetRolesAsync(user);
        if (roles.Contains(Roles.Admin)) return Forbid();

        await _userManager.DeleteAsync(user);
        return NoContent();
    }
}
