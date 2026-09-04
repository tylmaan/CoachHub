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
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ITokenService _tokenService;
    private readonly ITeamService _teamService;

    public AuthController(UserManager<ApplicationUser> userManager, ITokenService tokenService, ITeamService teamService)
    {
        _userManager = userManager;
        _tokenService = tokenService;
        _teamService = teamService;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null || !await _userManager.CheckPasswordAsync(user, request.Password))
        {
            return Unauthorized();
        }

        var token = await _tokenService.GenerateTokenAsync(user);
        var roles = await _userManager.GetRolesAsync(user);

        return new AuthResponse
        {
            Token = token,
            Email = user.Email!,
            Roles = roles.ToList(),
            TeamId = user.TeamId
        };
    }

    [HttpPost("register")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        if (!Roles.All.Contains(request.Role))
        {
            return BadRequest($"Invalid role. Allowed roles: {string.Join(", ", Roles.All)}");
        }

        if (request.Role != Roles.Admin)
        {
            if (request.TeamId is null)
            {
                return BadRequest("TeamId is required for this role.");
            }

            var team = await _teamService.GetByIdAsync(request.TeamId.Value);
            if (team is null)
            {
                return BadRequest("Team not found.");
            }
        }

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            EmailConfirmed = true,
            TeamId = request.Role == Roles.Admin ? null : request.TeamId
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            return BadRequest(result.Errors.Select(e => e.Description));
        }

        await _userManager.AddToRoleAsync(user, request.Role);

        var token = await _tokenService.GenerateTokenAsync(user);
        return new AuthResponse
        {
            Token = token,
            Email = user.Email!,
            Roles = [request.Role],
            TeamId = user.TeamId
        };
    }
} 