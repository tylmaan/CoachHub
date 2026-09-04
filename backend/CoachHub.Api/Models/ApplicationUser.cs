using Microsoft.AspNetCore.Identity;

namespace CoachHub.Api.Models;

public class ApplicationUser : IdentityUser
{
    public int? TeamId { get; set; }
    public Team? Team { get; set; }
}