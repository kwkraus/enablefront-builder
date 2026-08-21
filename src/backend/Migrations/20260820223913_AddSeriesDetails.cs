using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EnableFront.Builder.Migrations
{
    /// <inheritdoc />
    public partial class AddSeriesDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Details",
                table: "Series",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Details",
                table: "Series");
        }
    }
}
