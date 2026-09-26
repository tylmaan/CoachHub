using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CoachHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class CascadeDeleteReports : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Reports_Players_PlayerId",
                table: "Reports");

            migrationBuilder.DropForeignKey(
                name: "FK_Reports_Teams_TeamId",
                table: "Reports");

            migrationBuilder.AddForeignKey(
                name: "FK_Reports_Players_PlayerId",
                table: "Reports",
                column: "PlayerId",
                principalTable: "Players",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Reports_Teams_TeamId",
                table: "Reports",
                column: "TeamId",
                principalTable: "Teams",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Reports_Players_PlayerId",
                table: "Reports");

            migrationBuilder.DropForeignKey(
                name: "FK_Reports_Teams_TeamId",
                table: "Reports");

            migrationBuilder.AddForeignKey(
                name: "FK_Reports_Players_PlayerId",
                table: "Reports",
                column: "PlayerId",
                principalTable: "Players",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Reports_Teams_TeamId",
                table: "Reports",
                column: "TeamId",
                principalTable: "Teams",
                principalColumn: "Id");
        }
    }
}
