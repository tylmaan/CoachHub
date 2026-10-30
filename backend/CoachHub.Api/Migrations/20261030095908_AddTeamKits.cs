using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CoachHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTeamKits : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AwayKit_Pattern",
                table: "Teams",
                type: "TEXT",
                nullable: false,
                defaultValue: "Solid");

            migrationBuilder.AddColumn<string>(
                name: "AwayKit_PrimaryColor",
                table: "Teams",
                type: "TEXT",
                nullable: false,
                defaultValue: "#ffffff");

            migrationBuilder.AddColumn<string>(
                name: "AwayKit_SecondaryColor",
                table: "Teams",
                type: "TEXT",
                nullable: false,
                defaultValue: "#7c3aed");

            migrationBuilder.AddColumn<string>(
                name: "GoalkeeperKit_Pattern",
                table: "Teams",
                type: "TEXT",
                nullable: false,
                defaultValue: "Solid");

            migrationBuilder.AddColumn<string>(
                name: "GoalkeeperKit_PrimaryColor",
                table: "Teams",
                type: "TEXT",
                nullable: false,
                defaultValue: "#16a34a");

            migrationBuilder.AddColumn<string>(
                name: "GoalkeeperKit_SecondaryColor",
                table: "Teams",
                type: "TEXT",
                nullable: false,
                defaultValue: "#ffffff");

            migrationBuilder.AddColumn<string>(
                name: "HomeKit_Pattern",
                table: "Teams",
                type: "TEXT",
                nullable: false,
                defaultValue: "Solid");

            migrationBuilder.AddColumn<string>(
                name: "HomeKit_PrimaryColor",
                table: "Teams",
                type: "TEXT",
                nullable: false,
                defaultValue: "#7c3aed");

            migrationBuilder.AddColumn<string>(
                name: "HomeKit_SecondaryColor",
                table: "Teams",
                type: "TEXT",
                nullable: false,
                defaultValue: "#ffffff");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AwayKit_Pattern",
                table: "Teams");

            migrationBuilder.DropColumn(
                name: "AwayKit_PrimaryColor",
                table: "Teams");

            migrationBuilder.DropColumn(
                name: "AwayKit_SecondaryColor",
                table: "Teams");

            migrationBuilder.DropColumn(
                name: "GoalkeeperKit_Pattern",
                table: "Teams");

            migrationBuilder.DropColumn(
                name: "GoalkeeperKit_PrimaryColor",
                table: "Teams");

            migrationBuilder.DropColumn(
                name: "GoalkeeperKit_SecondaryColor",
                table: "Teams");

            migrationBuilder.DropColumn(
                name: "HomeKit_Pattern",
                table: "Teams");

            migrationBuilder.DropColumn(
                name: "HomeKit_PrimaryColor",
                table: "Teams");

            migrationBuilder.DropColumn(
                name: "HomeKit_SecondaryColor",
                table: "Teams");
        }
    }
}
