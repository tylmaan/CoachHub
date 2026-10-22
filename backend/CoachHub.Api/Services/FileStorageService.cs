namespace CoachHub.Api.Services;

public class FileStorageService : IFileStorageService
{
    private readonly IWebHostEnvironment _env;

    public FileStorageService(IWebHostEnvironment env)
    {
        _env = env;
    }

    public void DeleteFile(string? url)
    {
        if (string.IsNullOrEmpty(url)) return;
        if (!url.StartsWith("/uploads/")) return;

        var fileName = Path.GetFileName(url);
        var filePath = Path.Combine(_env.WebRootPath, "uploads", fileName);

        if (File.Exists(filePath))
        {
            File.Delete(filePath);
        }
    }
}
            