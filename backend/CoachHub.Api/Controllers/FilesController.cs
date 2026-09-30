using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CoachHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FilesController : ControllerBase
{
    private readonly IWebHostEnvironment _env;
    private static readonly string[] AllowedExtensions = [".jpg", ".png", ".jpeg"];
    private const long MaxFileSizeBytes = 5 * 1024 * 1024;

    public FilesController(IWebHostEnvironment env)
    {
        _env = env;
    }

    [HttpPost("upload")]
    public async Task<ActionResult<object>> Upload(IFormFile file)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest("Nie przesłano pliku.");
        }

        if (file.Length > MaxFileSizeBytes)
        {
            return BadRequest("Plik jest za duży (max 5MB).");
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
        {
            return BadRequest("Dozwolone są tylko pliki .jpg .jpeg .png.");
        }

        var uploadsFolder = Path.Combine(_env.WebRootPath, "uploads");
        Directory.CreateDirectory(uploadsFolder);

        var fileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(uploadsFolder, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        return Ok(new { url = $"/uploads/{fileName}" });
    }
}