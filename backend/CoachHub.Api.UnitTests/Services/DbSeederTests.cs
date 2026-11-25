using CoachHub.Api.Data;

namespace CoachHub.Api.UnitTests.Services;

public class DbSeederTests : IDisposable
{
    private const string AdminEmail = "admin@coachhub.local";
    private readonly IdentityHost _identity = new();

    public void Dispose() => _identity.Dispose();

    [Fact]
    public async Task SeedRolesAsync_CreatesEveryRole()
    {
        await DbSeeder.SeedRolesAsync(_identity.RoleManager);

        foreach (var role in Roles.All)
            (await _identity.RoleManager.RoleExistsAsync(role)).Should().BeTrue(role);
    }

    [Fact]
    public async Task SeedRolesAsync_IsIdempotent()
    {
        await DbSeeder.SeedRolesAsync(_identity.RoleManager);
        await DbSeeder.SeedRolesAsync(_identity.RoleManager);

        _identity.RoleManager.Roles.Count().Should().Be(Roles.All.Length);
    }

    [Fact]
    public async Task SeedAdminUserAsync_CreatesConfirmedAdminWithAdminRole()
    {
        await DbSeeder.SeedRolesAsync(_identity.RoleManager);

        await DbSeeder.SeedAdminUserAsync(_identity.UserManager, "Passw0rd!");

        var admin = await _identity.UserManager.FindByEmailAsync(AdminEmail);
        admin.Should().NotBeNull();
        admin!.EmailConfirmed.Should().BeTrue();
        admin.TeamId.Should().BeNull();
        (await _identity.UserManager.IsInRoleAsync(admin, Roles.Admin)).Should().BeTrue();
        (await _identity.UserManager.CheckPasswordAsync(admin, "Passw0rd!")).Should().BeTrue();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    public async Task SeedAdminUserAsync_DoesNothing_WhenPasswordIsNotConfigured(string? password)
    {
        await DbSeeder.SeedRolesAsync(_identity.RoleManager);

        await DbSeeder.SeedAdminUserAsync(_identity.UserManager, password);

        (await _identity.UserManager.FindByEmailAsync(AdminEmail)).Should().BeNull();
    }

    [Fact]
    public async Task SeedAdminUserAsync_DoesNotOverwriteExistingAdmin()
    {
        await DbSeeder.SeedRolesAsync(_identity.RoleManager);
        await DbSeeder.SeedAdminUserAsync(_identity.UserManager, "Passw0rd!");

        await DbSeeder.SeedAdminUserAsync(_identity.UserManager, "Different1!");

        _identity.UserManager.Users.Count(u => u.Email == AdminEmail).Should().Be(1);
        var admin = await _identity.UserManager.FindByEmailAsync(AdminEmail);
        (await _identity.UserManager.CheckPasswordAsync(admin!, "Passw0rd!")).Should().BeTrue();
        (await _identity.UserManager.CheckPasswordAsync(admin!, "Different1!")).Should().BeFalse();
    }

    [Fact]
    public async Task SeedAdminUserAsync_CreatesNoUser_WhenPasswordViolatesPolicy()
    {
        await DbSeeder.SeedRolesAsync(_identity.RoleManager);

        await DbSeeder.SeedAdminUserAsync(_identity.UserManager, "weak");

        (await _identity.UserManager.FindByEmailAsync(AdminEmail)).Should().BeNull();
    }
}
