namespace CoachHub.Api.Data;

public static class Roles
{
    public const string Admin = "Admin";
    public const string Coach = "Coach";
    public const string AssistantCoach = "AssistantCoach";
    public const string Analyst = "Analyst";

    public static readonly string[] All =  [Admin, Coach, AssistantCoach, Analyst];
}