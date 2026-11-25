using System.Net;
using System.Net.Http.Json;
using CoachHub.Api.Data;
using CoachHub.Api.DTOs;
using CoachHub.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace CoachHub.Api.IntegrationTests.Controllers;

public class UsersTests : ApiTestBase
{
    public UsersTests(CoachHubFactory factory) : base(factory) { }

    private static object UpdateBody(string role, int teamId, string? fullName = "Updated Name", string? photoUrl = null) =>
        new { role, teamId, fullName, photoUrl };

    private async Task<string> CreateUploadAsync(string name)
    {
        var path = Path.Combine(Factory.WebRoot, "uploads", name);
        await File.WriteAllTextAsync(path, "image");
        return path;
    }

    private async Task SetPhotoAsync(string userId, string photoUrl)
    {
        using var scope = Factory.Services.CreateScope();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var user = await users.FindByIdAsync(userId);
        user!.PhotoUrl = photoUrl;
        await users.UpdateAsync(user);
    }

    // ---------- list ----------

    [Fact]
    public async Task GetAll_ListsStaffWithRolesAndTeam_ButHidesAdmins()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Admin).GetAsync("/api/users");

        ShouldBe(response, HttpStatusCode.OK);
        var users = await ReadAsync<List<UserSummary>>(response);
        users.Should().NotContain(u => u.Id == world.Admin.Id);
        users.Should().NotContain(u => u.Email == "admin@coachhub.local");
        var coach = users.Single(u => u.Id == world.Coach.Id);
        coach.Roles.Should().Equal(Roles.Coach);
        coach.TeamId.Should().Be(world.Team.Id);
        coach.Email.Should().Be(world.Coach.Email);
    }

    [Fact]
    public async Task GetAll_NeverLeaksPasswordHashesOrSecurityStamps()
    {
        var world = await NewWorldAsync();
        await Factory.CreateUserAsync(Roles.Coach, world.Team.Id, "Passw0rd!");

        var raw = await (await world.As(world.Admin).GetAsync("/api/users")).Content.ReadAsStringAsync();

        raw.Should().NotContainEquivalentOf("passwordHash");
        raw.Should().NotContainEquivalentOf("securityStamp");
    }

    // ---------- update ----------

    [Fact]
    public async Task Update_ChangesRoleTeamAndName()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Admin).PutAsJsonAsync(
            $"/api/users/{world.Analyst.Id}", UpdateBody(Roles.AssistantCoach, world.OtherTeam.Id, "Promoted Person"));

        ShouldBe(response, HttpStatusCode.NoContent);
        var users = await ReadAsync<List<UserSummary>>(await world.As(world.Admin).GetAsync("/api/users"));
        var updated = users.Single(u => u.Id == world.Analyst.Id);
        updated.Roles.Should().Equal(Roles.AssistantCoach);
        updated.TeamId.Should().Be(world.OtherTeam.Id);
        updated.FullName.Should().Be("Promoted Person");
    }

    [Fact]
    public async Task Update_ReplacesAllPreviousRoles()
    {
        var world = await NewWorldAsync();
        var user = await Factory.CreateUserAsync(Roles.Coach, world.Team.Id);
        using (var scope = Factory.Services.CreateScope())
        {
            var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            await users.AddToRoleAsync((await users.FindByIdAsync(user.Id))!, Roles.Analyst);
        }

        await world.As(world.Admin).PutAsJsonAsync($"/api/users/{user.Id}", UpdateBody(Roles.Analyst, world.Team.Id));

        var list = await ReadAsync<List<UserSummary>>(await world.As(world.Admin).GetAsync("/api/users"));
        list.Single(u => u.Id == user.Id).Roles.Should().Equal(Roles.Analyst);
    }

    [Theory]
    [InlineData("Wizard")]
    [InlineData("Admin")]
    [InlineData("")]
    public async Task Update_Returns400_ForUnknownRoleOrPromotionToAdmin(string role)
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Admin).PutAsJsonAsync(
            $"/api/users/{world.Analyst.Id}", UpdateBody(role, world.Team.Id));

        ShouldBe(response, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Update_Returns400_ForUnknownTeam_AndLeavesTheUserUntouched()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Admin).PutAsJsonAsync(
            $"/api/users/{world.Analyst.Id}", UpdateBody(Roles.Coach, 999_999));

        ShouldBe(response, HttpStatusCode.BadRequest);
        var users = await ReadAsync<List<UserSummary>>(await world.As(world.Admin).GetAsync("/api/users"));
        users.Single(u => u.Id == world.Analyst.Id).Roles.Should().Equal(Roles.Analyst);
    }

    [Fact]
    public async Task Update_Returns404_ForMissingUser()
    {
        var world = await NewWorldAsync();

        var response = await world.As(world.Admin).PutAsJsonAsync(
            $"/api/users/{Guid.NewGuid()}", UpdateBody(Roles.Coach, world.Team.Id));

        ShouldBe(response, HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Update_Forbids_ModifyingAnAdmin()
    {
        var world = await NewWorldAsync();
        var otherAdmin = await Factory.CreateUserAsync(Roles.Admin, null);

        var response = await world.As(world.Admin).PutAsJsonAsync(
            $"/api/users/{otherAdmin.Id}", UpdateBody(Roles.Coach, world.Team.Id));

        ShouldBe(response, HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Update_DeletesTheOldPhotoFile_OnlyWhenThePhotoChanged()
    {
        var world = await NewWorldAsync();
        var name = $"{Guid.NewGuid():N}.png";
        var path = await CreateUploadAsync(name);
        await SetPhotoAsync(world.Analyst.Id, $"/uploads/{name}");

        await world.As(world.Admin).PutAsJsonAsync(
            $"/api/users/{world.Analyst.Id}", UpdateBody(Roles.Analyst, world.Team.Id, photoUrl: $"/uploads/{name}"));
        File.Exists(path).Should().BeTrue();

        await world.As(world.Admin).PutAsJsonAsync(
            $"/api/users/{world.Analyst.Id}", UpdateBody(Roles.Analyst, world.Team.Id, photoUrl: null));
        File.Exists(path).Should().BeFalse();
    }

    // ---------- delete ----------

    [Fact]
    public async Task Delete_RemovesTheUser_SoTheyCanNoLongerLogIn()
    {
        var world = await NewWorldAsync();
        var user = await Factory.CreateUserAsync(Roles.Analyst, world.Team.Id, "Passw0rd!");
        var login = new LoginRequest { Email = user.Email, Password = "Passw0rd!" };
        ShouldBe(await world.Anonymous().PostAsJsonAsync("/api/auth/login", login), HttpStatusCode.OK);

        var response = await world.As(world.Admin).DeleteAsync($"/api/users/{user.Id}");

        ShouldBe(response, HttpStatusCode.NoContent);
        ShouldBe(await world.Anonymous().PostAsJsonAsync("/api/auth/login", login), HttpStatusCode.Unauthorized);
        var users = await ReadAsync<List<UserSummary>>(await world.As(world.Admin).GetAsync("/api/users"));
        users.Should().NotContain(u => u.Id == user.Id);
    }

    [Fact]
    public async Task Delete_RemovesThePhotoFile()
    {
        var world = await NewWorldAsync();
        var user = await Factory.CreateUserAsync(Roles.Analyst, world.Team.Id);
        var name = $"{Guid.NewGuid():N}.png";
        var path = await CreateUploadAsync(name);
        await SetPhotoAsync(user.Id, $"/uploads/{name}");

        await world.As(world.Admin).DeleteAsync($"/api/users/{user.Id}");

        File.Exists(path).Should().BeFalse();
    }

    [Fact]
    public async Task Delete_Forbids_RemovingAnAdmin_And404sMissing()
    {
        var world = await NewWorldAsync();
        var otherAdmin = await Factory.CreateUserAsync(Roles.Admin, null);

        ShouldBe(await world.As(world.Admin).DeleteAsync($"/api/users/{otherAdmin.Id}"), HttpStatusCode.Forbidden);
        ShouldBe(await world.As(world.Admin).DeleteAsync($"/api/users/{Guid.NewGuid()}"), HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Delete_CascadesToTheUsersReadMarks()
    {
        var world = await NewWorldAsync();
        var user = await Factory.CreateUserAsync(Roles.Analyst, world.Team.Id);
        await world.As(user).PostAsync($"/api/reports/{world.Report.Id}/read", null);

        ShouldBe(await world.As(world.Admin).DeleteAsync($"/api/users/{user.Id}"), HttpStatusCode.NoContent);

        var marks = await Factory.WithDbAsync(db => db.ReportReads.CountAsync(r => r.UserId == user.Id));
        marks.Should().Be(0);
    }
}
