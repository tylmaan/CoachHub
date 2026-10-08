using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CoachHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMatchDetailsFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsHome",
                table: "Matches",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MatchType",
                table: "Matches",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OpponentLogoUrl",
                table: "Matches",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Round",
                table: "Matches",
                type: "INTEGER",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsHome",
                table: "Matches");

            migrationBuilder.DropColumn(
                name: "MatchType",
                table: "Matches");

            migrationBuilder.DropColumn(
                name: "OpponentLogoUrl",
                table: "Matches");

            migrationBuilder.DropColumn(
                name: "Round",
                table: "Matches");
        }
    }
}
