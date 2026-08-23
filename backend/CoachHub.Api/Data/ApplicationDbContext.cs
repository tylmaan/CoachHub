using Microsoft.EntityFrameworkCore;
using CoachHub.Api.Models;

namespace CoachHub.Api.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : 
base(options)
    {
    }

    public DbSet<Team> Teams { get; set; }
}