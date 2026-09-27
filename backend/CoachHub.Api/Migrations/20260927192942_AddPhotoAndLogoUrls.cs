using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CoachHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPhotoAndLogoUrls : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "LogoUrl",
                table: "Teams",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PhotoUrl",
                table: "Players",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PhotoUrl",
                table: "AspNetUsers",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LogoUrl",
                table: "Teams");

            migrationBuilder.DropColumn(
                name: "PhotoUrl",
                table: "Players");

            migrationBuilder.DropColumn(
                name: "PhotoUrl",
                table: "AspNetUsers");
        }
    }
}
