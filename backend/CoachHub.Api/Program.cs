using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<CoachHub.Api.Data.ApplicationDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<CoachHub.Api.Services.ITeamService, CoachHub.Api.Services.TeamService>();
builder.Services.AddScoped<CoachHub.Api.Services.IPlayerService, CoachHub.Api.Services.PlayerService>();

builder.Services.AddIdentity<CoachHub.Api.Models.ApplicationUser, Microsoft.AspNetCore.Identity.IdentityRole>()
    .AddEntityFrameworkStores<CoachHub.Api.Data.ApplicationDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddControllers(); 
builder.Services.AddOpenApi();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<Microsoft.AspNetCore.Identity.IdentityRole>>();
    await CoachHub.Api.Data.DbSeeder.SeedRolesAsync(roleManager);

}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run(); 
