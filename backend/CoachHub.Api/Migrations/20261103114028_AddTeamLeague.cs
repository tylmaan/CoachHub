using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CoachHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTeamLeague : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "League",
                table: "Teams",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "League",
                table: "Teams");
        }
    }
}
