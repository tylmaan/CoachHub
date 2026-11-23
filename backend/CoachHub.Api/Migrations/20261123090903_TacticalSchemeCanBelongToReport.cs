using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CoachHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class TacticalSchemeCanBelongToReport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "MatchId",
                table: "TacticalSchemes",
                type: "INTEGER",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "INTEGER");

            migrationBuilder.AddColumn<int>(
                name: "ReportId",
                table: "TacticalSchemes",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TacticalSchemes_ReportId",
                table: "TacticalSchemes",
                column: "ReportId");

            migrationBuilder.AddForeignKey(
                name: "FK_TacticalSchemes_Reports_ReportId",
                table: "TacticalSchemes",
                column: "ReportId",
                principalTable: "Reports",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TacticalSchemes_Reports_ReportId",
                table: "TacticalSchemes");

            migrationBuilder.DropIndex(
                name: "IX_TacticalSchemes_ReportId",
                table: "TacticalSchemes");

            migrationBuilder.DropColumn(
                name: "ReportId",
                table: "TacticalSchemes");

            migrationBuilder.AlterColumn<int>(
                name: "MatchId",
                table: "TacticalSchemes",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "INTEGER",
                oldNullable: true);
        }
    }
}
