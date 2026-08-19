using Microsoft.EntityFrameworkCore;

namespace CoachHub.Api.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : 
base(options)
    {
    }
}