using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CoachHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddEventTeamAndOpponentPlayerChangeRoundToString : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MatchEvents_Players_PlayerId",
                table: "MatchEvents");

            migrationBuilder.AlterColumn<int>(
                name: "PlayerId",
                table: "MatchEvents",
                type: "INTEGER",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "INTEGER");

            migrationBuilder.AddColumn<string>(
                name: "OpponentPlayerName",
                table: "MatchEvents",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Team",
                table: "MatchEvents",
                type: "TEXT",
                nullable: false,
                defaultValue: "Us");

            migrationBuilder.AlterColumn<string>(
                name: "Round",
                table: "Matches",
                type: "TEXT",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "INTEGER",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_MatchEvents_Players_PlayerId",
                table: "MatchEvents",
                column: "PlayerId",
                principalTable: "Players",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MatchEvents_Players_PlayerId",
                table: "MatchEvents");

            migrationBuilder.DropColumn(
                name: "OpponentPlayerName",
                table: "MatchEvents");

            migrationBuilder.DropColumn(
                name: "Team",
                table: "MatchEvents");

            migrationBuilder.AlterColumn<int>(
                name: "PlayerId",
                table: "MatchEvents",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "INTEGER",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "Round",
                table: "Matches",
                type: "INTEGER",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_MatchEvents_Players_PlayerId",
                table: "MatchEvents",
                column: "PlayerId",
                principalTable: "Players",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
