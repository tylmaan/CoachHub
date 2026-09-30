using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CoachHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMatchTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Matches",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Date = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    Opponent = table.Column<string>(type: "TEXT", nullable: false),
                    Season = table.Column<string>(type: "TEXT", nullable: false),
                    ScoreFor = table.Column<int>(type: "INTEGER", nullable: true),
                    ScoreAgainst = table.Column<int>(type: "INTEGER", nullable: true),
                    TeamId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Matches", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Matches_Teams_TeamId",
                        column: x => x.TeamId,
                        principalTable: "Teams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MatchAppearances",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    MinutesPlayed = table.Column<int>(type: "INTEGER", nullable: true),
                    MatchId = table.Column<int>(type: "INTEGER", nullable: false),
                    PlayerId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MatchAppearances", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MatchAppearances_Matches_MatchId",
                        column: x => x.MatchId,
                        principalTable: "Matches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MatchAppearances_Players_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "Players",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MatchEvents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    EventType = table.Column<string>(type: "TEXT", nullable: false),
                    Minute = table.Column<int>(type: "INTEGER", nullable: true),
                    MatchId = table.Column<int>(type: "INTEGER", nullable: false),
                    PlayerId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MatchEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MatchEvents_Matches_MatchId",
                        column: x => x.MatchId,
                        principalTable: "Matches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MatchEvents_Players_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "Players",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MatchAppearances_MatchId",
                table: "MatchAppearances",
                column: "MatchId");

            migrationBuilder.CreateIndex(
                name: "IX_MatchAppearances_PlayerId",
                table: "MatchAppearances",
                column: "PlayerId");

            migrationBuilder.CreateIndex(
                name: "IX_Matches_TeamId",
                table: "Matches",
                column: "TeamId");

            migrationBuilder.CreateIndex(
                name: "IX_MatchEvents_MatchId",
                table: "MatchEvents",
                column: "MatchId");

            migrationBuilder.CreateIndex(
                name: "IX_MatchEvents_PlayerId",
                table: "MatchEvents",
                column: "PlayerId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MatchAppearances");

            migrationBuilder.DropTable(
                name: "MatchEvents");

            migrationBuilder.DropTable(
                name: "Matches");
        }
    }
}
