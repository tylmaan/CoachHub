using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using CoachHub.Api.Data;

namespace CoachHub.Api.IntegrationTests.Controllers;

public class FilesTests : ApiTestBase
{
    private const long MaxSize = 5 * 1024 * 1024;

    public FilesTests(CoachHubFactory factory) : base(factory) { }

    private static MultipartFormDataContent Form(string fileName, byte[] content, string field = "file")
    {
        var form = new MultipartFormDataContent();
        form.Add(new ByteArrayContent(content), field, fileName);
        return form;
    }

    private static async Task<string> UrlOf(HttpResponseMessage response)
    {
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return json.RootElement.GetProperty("url").GetString()!;
    }

    private async Task<HttpClient> AnalystClientAsync()
    {
        var user = await Factory.CreateUserAsync(Roles.Analyst, null);
        return Factory.ClientFor(user);
    }

    [Theory]
    [InlineData("photo.png", ".png")]
    [InlineData("photo.jpg", ".jpg")]
    [InlineData("photo.jpeg", ".jpeg")]
    [InlineData("PHOTO.PNG", ".png")]
    [InlineData("Holiday.JpG", ".jpg")]
    public async Task Upload_StoresAllowedImages_UnderAGeneratedName(string fileName, string expectedExtension)
    {
        var client = await AnalystClientAsync();
        var bytes = new byte[] { 1, 2, 3, 4, 5 };

        var response = await client.PostAsync("/api/files/upload", Form(fileName, bytes));

        ShouldBe(response, HttpStatusCode.OK);
        var url = await UrlOf(response);
        url.Should().StartWith("/uploads/").And.EndWith(expectedExtension);
        url.Should().NotContainEquivalentOf(Path.GetFileNameWithoutExtension(fileName));
        var stored = Path.Combine(Factory.WebRoot, "uploads", Path.GetFileName(url));
        (await File.ReadAllBytesAsync(stored)).Should().Equal(bytes);
    }

    [Fact]
    public async Task Upload_MakesTheFileAvailableOverHttp_WithoutAuthentication()
    {
        var client = await AnalystClientAsync();
        var bytes = new byte[] { 9, 8, 7 };
        var url = await UrlOf(await client.PostAsync("/api/files/upload", Form("logo.png", bytes)));

        var served = await Factory.ClientFor().GetAsync(url);

        ShouldBe(served, HttpStatusCode.OK);
        (await served.Content.ReadAsByteArrayAsync()).Should().Equal(bytes);
    }

    [Fact]
    public async Task Upload_GivesEveryFileADifferentName()
    {
        var client = await AnalystClientAsync();

        var first = await UrlOf(await client.PostAsync("/api/files/upload", Form("same.png", new byte[] { 1 })));
        var second = await UrlOf(await client.PostAsync("/api/files/upload", Form("same.png", new byte[] { 2 })));

        first.Should().NotBe(second);
    }

    [Theory]
    [InlineData("anim.gif")]
    [InlineData("vector.svg")]
    [InlineData("script.exe")]
    [InlineData("page.html")]
    [InlineData("archive.png.zip")]
    [InlineData("noextension")]
    public async Task Upload_Returns400_ForDisallowedExtensions(string fileName)
    {
        var client = await AnalystClientAsync();

        var response = await client.PostAsync("/api/files/upload", Form(fileName, new byte[] { 1, 2, 3 }));

        ShouldBe(response, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Upload_Returns400_ForAnEmptyFile()
    {
        var client = await AnalystClientAsync();

        var response = await client.PostAsync("/api/files/upload", Form("empty.png", Array.Empty<byte>()));

        ShouldBe(response, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Upload_LimitsFilesTo5MB()
    {
        var client = await AnalystClientAsync();

        var atLimit = await client.PostAsync("/api/files/upload", Form("big.png", new byte[MaxSize]));
        var overLimit = await client.PostAsync("/api/files/upload", Form("bigger.png", new byte[MaxSize + 1]));

        ShouldBe(atLimit, HttpStatusCode.OK);
        ShouldBe(overLimit, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Upload_Returns400_WhenTheFileFieldIsMissing()
    {
        var client = await AnalystClientAsync();

        var response = await client.PostAsync("/api/files/upload", Form("photo.png", new byte[] { 1 }, field: "attachment"));

        ShouldBe(response, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Upload_IgnoresDirectoryComponentsInTheClientFileName()
    {
        var client = await AnalystClientAsync();

        var response = await client.PostAsync("/api/files/upload", Form("../../escape.png", new byte[] { 1 }));

        ShouldBe(response, HttpStatusCode.OK);
        var url = await UrlOf(response);
        url.Should().StartWith("/uploads/").And.NotContain("..");
        File.Exists(Path.Combine(Factory.WebRoot, "uploads", Path.GetFileName(url))).Should().BeTrue();
        File.Exists(Path.Combine(Factory.WebRoot, "escape.png")).Should().BeFalse();
    }

    [Fact]
    public async Task Upload_Returns401_ForAnonymousCallers()
    {
        var response = await Factory.ClientFor().PostAsync("/api/files/upload", Form("photo.png", new byte[] { 1 }));

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
