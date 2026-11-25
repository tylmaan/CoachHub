global using AwesomeAssertions;
global using CoachHub.Api.IntegrationTests.Infrastructure;

using CoachHub.Api.Data;
using CoachHub.Api.Models;
using CoachHub.Api.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CoachHub.Api.IntegrationTests.Infrastructure;

public sealed record TestUser(string Id, string Email, string Role, int? TeamId, string Token);

public sealed class CoachHubFactory : WebApplicationFactory<Program>
{
    public const string JwtKey = "integration-test-signing-key-long-enough-for-hs256";
    public const string JwtIssuer = "CoachHub";
    public const string JwtAudience = "CoachHub.Client";
    public const string SeedAdminPassword = "Seed-Passw0rd!";

    private readonly string _connectionString = $"Data Source=coachhub_{Guid.NewGuid():N};Mode=Memory;Cache=Shared";
    private readonly SqliteConnection _keeper;
    private readonly string _webRoot = Path.Combine(Path.GetTempPath(), "coachhub-it-" + Guid.NewGuid().ToString("N"));

    public string WebRoot => _webRoot;

    public CoachHubFactory()
    {
        Directory.CreateDirectory(Path.Combine(_webRoot, "uploads"));

        _keeper = new SqliteConnection(_connectionString);
        _keeper.Open();

        var options = new DbContextOptionsBuilder<ApplicationDbContext>().UseSqlite(_connectionString).Options;
        using var context = new ApplicationDbContext(options);
        context.Database.EnsureCreated();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseWebRoot(_webRoot);
        builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] = _connectionString,
            ["Jwt:Key"] = JwtKey,
            ["Seed:AdminPassword"] = SeedAdminPassword
        }));
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (!disposing) return;

        _keeper.Dispose();
        try { Directory.Delete(_webRoot, recursive: true); } catch (IOException) { }
    }

    public async Task<T> WithDbAsync<T>(Func<ApplicationDbContext, Task<T>> action)
    {
        using var scope = Services.CreateScope();
        return await action(scope.ServiceProvider.GetRequiredService<ApplicationDbContext>());
    }

    public Task WithDbAsync(Func<ApplicationDbContext, Task> action) =>
        WithDbAsync<object?>(async db => { await action(db); return null; });

    public async Task<TestUser> CreateUserAsync(string role, int? teamId, string? password = null, string? fullName = null)
    {
        using var scope = Services.CreateScope();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        var email = $"{role.ToLowerInvariant()}-{Guid.NewGuid():N}@test.local";
        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            EmailConfirmed = true,
            TeamId = teamId,
            FullName = fullName ?? $"{role} {Guid.NewGuid():N}"[..14]
        };

        var created = password is null
            ? await users.CreateAsync(user)
            : await users.CreateAsync(user, password);
        created.Succeeded.Should().BeTrue(string.Join("; ", created.Errors.Select(e => e.Description)));
        await users.AddToRoleAsync(user, role);

        var token = await scope.ServiceProvider.GetRequiredService<ITokenService>().GenerateTokenAsync(user);
        return new TestUser(user.Id, email, role, teamId, token);
    }

    public HttpClient ClientFor(TestUser? user = null)
    {
        var client = CreateClient();
        if (user is not null)
            client.DefaultRequestHeaders.Authorization = new("Bearer", user.Token);
        return client;
    }
}
