using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<CoachHub.Api.Data.ApplicationDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173") 
                .AllowAnyHeader()
                .AllowAnyMethod();
    });
});

builder.Services.AddScoped<CoachHub.Api.Services.ITeamService, CoachHub.Api.Services.TeamService>();
builder.Services.AddScoped<CoachHub.Api.Services.IPlayerService, CoachHub.Api.Services.PlayerService>();
builder.Services.AddScoped<CoachHub.Api.Services.ITokenService, CoachHub.Api.Services.TokenService>();
builder.Services.AddScoped<CoachHub.Api.Services.IPlayerSeasonStatService, CoachHub.Api.Services.PlayerSeasonStatService>();
builder.Services.AddScoped<CoachHub.Api.Services.ICareerHistoryEntryService, CoachHub.Api.Services.CareerHistoryEntryService>();
builder.Services.AddScoped<CoachHub.Api.Services.IReportService, CoachHub.Api.Services.ReportService>();
builder.Services.AddScoped<CoachHub.Api.Services.ITacticalSchemeService, CoachHub.Api.Services.TacticalSchemeService>();

builder.Services.AddIdentity<CoachHub.Api.Models.ApplicationUser, Microsoft.AspNetCore.Identity.IdentityRole>()
    .AddEntityFrameworkStores<CoachHub.Api.Data.ApplicationDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidateAudience = true,
        ValidAudience = builder.Configuration["Jwt:Audience"],
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
    };
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddOpenApi();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<Microsoft.AspNetCore.Identity.IdentityRole>>();
    await CoachHub.Api.Data.DbSeeder.SeedRolesAsync(roleManager);

    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<CoachHub.Api.Models.ApplicationUser>>();
    await CoachHub.Api.Data.DbSeeder.SeedAdminUserAsync(userManager);
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run(); 
