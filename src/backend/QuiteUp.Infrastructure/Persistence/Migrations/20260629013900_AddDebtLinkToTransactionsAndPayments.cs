using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QuiteUp.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDebtLinkToTransactionsAndPayments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "debt_id",
                table: "transactions",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "account_id",
                table: "debt_payments",
                type: "bigint",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_transactions_debt_id",
                table: "transactions",
                column: "debt_id");

            migrationBuilder.CreateIndex(
                name: "ix_debt_payments_account_id",
                table: "debt_payments",
                column: "account_id");

            migrationBuilder.AddForeignKey(
                name: "FK_debt_payments_accounts_account_id",
                table: "debt_payments",
                column: "account_id",
                principalTable: "accounts",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_transactions_debts_debt_id",
                table: "transactions",
                column: "debt_id",
                principalTable: "debts",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_debt_payments_accounts_account_id",
                table: "debt_payments");

            migrationBuilder.DropForeignKey(
                name: "FK_transactions_debts_debt_id",
                table: "transactions");

            migrationBuilder.DropIndex(
                name: "ix_transactions_debt_id",
                table: "transactions");

            migrationBuilder.DropIndex(
                name: "ix_debt_payments_account_id",
                table: "debt_payments");

            migrationBuilder.DropColumn(
                name: "debt_id",
                table: "transactions");

            migrationBuilder.DropColumn(
                name: "account_id",
                table: "debt_payments");
        }
    }
}
