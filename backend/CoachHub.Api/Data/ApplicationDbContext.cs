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
    public DbSet<TacticalScheme> TacticalSchemes { get; set; }
    public DbSet<Match> Matches { get; set; }
    public DbSet<MatchAppearance> MatchAppearances { get; set; }
    public DbSet<MatchEvent> MatchEvents { get; set; }
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

        modelBuilder.Entity<Report>()
            .HasOne(r => r.Match)
            .WithMany(m => m.Reports)
            .HasForeignKey(r => r.MatchId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MatchAppearance>()
            .HasOne(a => a.Player)
            .WithMany(p => p.MatchAppearances)
            .HasForeignKey(a => a.PlayerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<MatchEvent>()
            .HasOne(e => e.Player)
            .WithMany(p => p.MatchEvents)
            .HasForeignKey(e => e.PlayerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Team>(entity =>
        {
            entity.ComplexProperty(t => t.HomeKit);
            entity.ComplexProperty(t => t.AwayKit);
            entity.ComplexProperty(t => t.GoalkeeperKit);
        }); 
    }
}