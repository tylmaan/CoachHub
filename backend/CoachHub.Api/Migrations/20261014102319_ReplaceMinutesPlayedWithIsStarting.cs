using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CoachHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class ReplaceMinutesPlayedWithIsStarting : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MinutesPlayed",
                table: "MatchAppearances");

            migrationBuilder.AddColumn<bool>(
                name: "IsStarting",
                table: "MatchAppearances",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsStarting",
                table: "MatchAppearances");

            migrationBuilder.AddColumn<int>(
                name: "MinutesPlayed",
                table: "MatchAppearances",
                type: "INTEGER",
                nullable: true);
        }
    }
}
