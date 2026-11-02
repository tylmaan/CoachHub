using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CoachHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddReportMatch : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MatchId",
                table: "Reports",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Reports_MatchId",
                table: "Reports",
                column: "MatchId");

            migrationBuilder.AddForeignKey(
                name: "FK_Reports_Matches_MatchId",
                table: "Reports",
                column: "MatchId",
                principalTable: "Matches",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Reports_Matches_MatchId",
                table: "Reports");

            migrationBuilder.DropIndex(
                name: "IX_Reports_MatchId",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "MatchId",
                table: "Reports");
        }
    }
}
