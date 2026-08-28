using CoachHub.Api.Models;
using CoachHub.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace CoachHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CareerHistoryEntriesController : ControllerBase
{
    private readonly ICareerHistoryEntryService _careerHistoryEntryService;
    
    public CareerHistoryEntriesController(ICareerHistoryEntryService careerHistoryEntryService)
    {
        _careerHistoryEntryService = careerHistoryEntryService;
    }

    [HttpGet]
    public async Task<ActionResult<List<CareerHistoryEntry>>> GetAll()
    {
        return await _careerHistoryEntryService.GetAllAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CareerHistoryEntry>> GetById(int id)
    {
        var entry = await _careerHistoryEntryService.GetByIdAsync(id);
        if (entry is null) return NotFound();
        return entry;
    }

    [HttpPost]
    public async Task<ActionResult<CareerHistoryEntry>> Create(CareerHistoryEntry entry)
    {
        var created = await _careerHistoryEntryService.CreateAsync(entry);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, CareerHistoryEntry entry)
    {
        var success = await _careerHistoryEntryService.UpdateAsync(id, entry);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var success = await _careerHistoryEntryService.DeleteAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }
}