using CoachHub.Api.Models;
using CoachHub.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace CoachHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlayersController : ControllerBase
{
    private readonly IPlayerService _playerService;

    public PlayersController(IPlayerService playerService)
    {
        _playerService = playerService;
    }

    [HttpGet]
    public async Task<ActionResult<List<Player>>> GetAll()
    {
        return await _playerService.GetAllAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Player>> GetById(int id)
    {
        var player = await _playerService.GetByIdAsync(id);
        if (player is null) return NotFound();
        return player;
    }

    [HttpPost]
    public async Task<ActionResult<Player>> Create(Player player)
    {
        var created = await _playerService.CreateAsync(player);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, Player player)
    {
        var success = await _playerService.UpdateAsync(id, player);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var success = await _playerService.DeleteAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }
}