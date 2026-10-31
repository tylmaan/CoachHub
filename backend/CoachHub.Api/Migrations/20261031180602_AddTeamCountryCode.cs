using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CoachHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTeamCountryCode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CountryCode",
                table: "Teams",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CountryCode",
                table: "Teams");
        }
    }
}
