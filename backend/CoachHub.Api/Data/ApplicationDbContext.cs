using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using CoachHub.Api.Models;

namespace CoachHub.Api.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : 
base(options)
    {
    }
    public DbSet<Team> Teams { get; set; }
    public DbSet<Player> Players { get; set; }
}