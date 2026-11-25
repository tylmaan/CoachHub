using CoachHub.Api.Services;
using Microsoft.AspNetCore.Hosting;

namespace CoachHub.Api.UnitTests.Services;

public class FileStorageServiceTests : IDisposable
{
    private readonly string _webRoot;
    private readonly string _uploads;
    private readonly FileStorageService _sut;

    public FileStorageServiceTests()
    {
        _webRoot = Path.Combine(Path.GetTempPath(), "coachhub-tests-" + Guid.NewGuid().ToString("N"));
        _uploads = Path.Combine(_webRoot, "uploads");
        Directory.CreateDirectory(_uploads);

        var env = Substitute.For<IWebHostEnvironment>();
        env.WebRootPath.Returns(_webRoot);
        _sut = new FileStorageService(env);
    }

    public void Dispose()
    {
        if (Directory.Exists(_webRoot)) Directory.Delete(_webRoot, recursive: true);
    }

    private string CreateUpload(string name)
    {
        var path = Path.Combine(_uploads, name);
        File.WriteAllText(path, "data");
        return path;
    }

    [Fact]
    public void DeleteFile_RemovesExistingUpload()
    {
        var path = CreateUpload("photo.png");

        _sut.DeleteFile("/uploads/photo.png");

        File.Exists(path).Should().BeFalse();
    }

    [Fact]
    public void DeleteFile_KeepsOtherUploads()
    {
        var other = CreateUpload("other.png");
        CreateUpload("photo.png");

        _sut.DeleteFile("/uploads/photo.png");

        File.Exists(other).Should().BeTrue();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    public void DeleteFile_DoesNothing_ForEmptyUrl(string? url)
    {
        var path = CreateUpload("photo.png");

        var act = () => _sut.DeleteFile(url);

        act.Should().NotThrow();
        File.Exists(path).Should().BeTrue();
    }

    [Theory]
    [InlineData("https://cdn.example.com/uploads/photo.png")]
    [InlineData("/images/photo.png")]
    [InlineData("uploads/photo.png")]
    public void DeleteFile_IgnoresUrlsOutsideUploadsPrefix(string url)
    {
        var path = CreateUpload("photo.png");

        _sut.DeleteFile(url);

        File.Exists(path).Should().BeTrue();
    }

    [Fact]
    public void DeleteFile_DoesNotThrow_WhenFileDoesNotExist()
    {
        var act = () => _sut.DeleteFile("/uploads/missing.png");

        act.Should().NotThrow();
    }

    [Fact]
    public void DeleteFile_CannotEscapeUploadsDirectory()
    {
        var outside = Path.Combine(_webRoot, "secret.txt");
        File.WriteAllText(outside, "secret");

        _sut.DeleteFile("/uploads/../secret.txt");

        File.Exists(outside).Should().BeTrue();
    }
}
