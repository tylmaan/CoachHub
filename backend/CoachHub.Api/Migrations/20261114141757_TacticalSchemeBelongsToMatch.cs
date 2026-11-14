using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CoachHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class TacticalSchemeBelongsToMatch : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DELETE FROM \"TacticalSchemes\";");

            migrationBuilder.DropForeignKey(
                name: "FK_TacticalSchemes_Teams_TeamId",
                table: "TacticalSchemes");

            migrationBuilder.RenameColumn(
                name: "TeamId",
                table: "TacticalSchemes",
                newName: "MatchId");

            migrationBuilder.DropColumn(
                name: "CanvasData",
                table: "TacticalSchemes");
            
            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "TacticalSchemes",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.RenameIndex(
                name: "IX_TacticalSchemes_TeamId",
                table: "TacticalSchemes",
                newName: "IX_TacticalSchemes_MatchId");

            migrationBuilder.AddColumn<string>(
                name: "Data",
                table: "TacticalSchemes",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddForeignKey(
                name: "FK_TacticalSchemes_Matches_MatchId",
                table: "TacticalSchemes",
                column: "MatchId",
                principalTable: "Matches",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TacticalSchemes_Matches_MatchId",
                table: "TacticalSchemes");

            migrationBuilder.DropColumn(
                name: "Data",
                table: "TacticalSchemes");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "TacticalSchemes");
            
            migrationBuilder.AddColumn<string>(
                name: "CanvasData",
                table: "TacticalSchemes",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.RenameColumn(
                name: "MatchId",
                table: "TacticalSchemes",
                newName: "TeamId");

            migrationBuilder.RenameIndex(
                name: "IX_TacticalSchemes_MatchId",
                table: "TacticalSchemes",
                newName: "IX_TacticalSchemes_TeamId");

            migrationBuilder.AddForeignKey(
                name: "FK_TacticalSchemes_Teams_TeamId",
                table: "TacticalSchemes",
                column: "TeamId",
                principalTable: "Teams",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
