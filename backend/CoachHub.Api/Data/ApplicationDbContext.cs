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
    public DbSet<PlayerSeasonStat> PlayerSeasonStats { get; set; }
    public DbSet<CareerHistoryEntry> CareerHistoryEntries { get; set; }
    public DbSet<TacticalScheme> TacticalSchemes { get; set; }
    public DbSet<Report> Reports { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Report>()
            .HasOne(r => r.Player)
            .WithMany(p => p.Reports)
            .HasForeignKey(r => r.PlayerId)
            .OnDelete(DeleteBehavior.Cascade);
        
        modelBuilder.Entity<Report>()
            .HasOne(r => r.Team)
            .WithMany(t => t.Reports)
            .HasForeignKey(r => r.TeamId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}