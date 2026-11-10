using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CoachHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPlayerArchive : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MatchAppearances_Players_PlayerId",
                table: "MatchAppearances");

            migrationBuilder.DropForeignKey(
                name: "FK_MatchEvents_Players_PlayerId",
                table: "MatchEvents");

            migrationBuilder.AddColumn<DateOnly>(
                name: "ArchivedAt",
                table: "Players",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_MatchAppearances_Players_PlayerId",
                table: "MatchAppearances",
                column: "PlayerId",
                principalTable: "Players",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_MatchEvents_Players_PlayerId",
                table: "MatchEvents",
                column: "PlayerId",
                principalTable: "Players",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MatchAppearances_Players_PlayerId",
                table: "MatchAppearances");

            migrationBuilder.DropForeignKey(
                name: "FK_MatchEvents_Players_PlayerId",
                table: "MatchEvents");

            migrationBuilder.DropColumn(
                name: "ArchivedAt",
                table: "Players");

            migrationBuilder.AddForeignKey(
                name: "FK_MatchAppearances_Players_PlayerId",
                table: "MatchAppearances",
                column: "PlayerId",
                principalTable: "Players",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_MatchEvents_Players_PlayerId",
                table: "MatchEvents",
                column: "PlayerId",
                principalTable: "Players",
                principalColumn: "Id");
        }
    }
}
