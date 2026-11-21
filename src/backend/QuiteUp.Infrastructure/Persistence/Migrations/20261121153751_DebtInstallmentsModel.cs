using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QuiteUp.Infrastructure.Persistence.Migrations
{
    /// <summary>
    /// Separa o vencimento mensal da data final da dívida.
    /// Escrita à mão: o scaffold apagava due_date (perda de dados). Aqui a coluna é
    /// renomeada para payoff_date e as dívidas existentes são marcadas para revisão.
    /// </summary>
    public partial class DebtInstallmentsModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // A antiga "Data de Vencimento" vira a previsão de quitação ("quitar até").
            migrationBuilder.RenameColumn(
                name: "due_date",
                table: "debts",
                newName: "payoff_date");

            migrationBuilder.AlterColumn<DateOnly>(
                name: "payoff_date",
                table: "debts",
                type: "date",
                nullable: true,
                oldClrType: typeof(DateOnly),
                oldType: "date");

            migrationBuilder.AlterColumn<decimal>(
                name: "interest_rate",
                table: "debts",
                type: "numeric(18,4)",
                precision: 18,
                scale: 4,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(18,2)",
                oldPrecision: 18,
                oldScale: 2,
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "due_day",
                table: "debts",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "first_installment_date",
                table: "debts",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "initial_paid_installments",
                table: "debts",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "installment_amount",
                table: "debts",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "installment_count",
                table: "debts",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "interest_period",
                table: "debts",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "needs_review",
                table: "debts",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "payment_mode",
                table: "debts",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            // Dívidas existentes: não há dados de parcelas. Ficam como "sem parcelas fixas",
            // com o dia da antiga data como dia de vencimento, e sinalizadas para o usuário
            // confirmar as parcelas (aviso no card). Nenhum valor é perdido.
            migrationBuilder.Sql(@"
                UPDATE debts
                SET payment_mode = 1,
                    due_day = EXTRACT(DAY FROM payoff_date)::integer,
                    needs_review = TRUE
                WHERE payoff_date IS NOT NULL;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "due_day", table: "debts");
            migrationBuilder.DropColumn(name: "first_installment_date", table: "debts");
            migrationBuilder.DropColumn(name: "initial_paid_installments", table: "debts");
            migrationBuilder.DropColumn(name: "installment_amount", table: "debts");
            migrationBuilder.DropColumn(name: "installment_count", table: "debts");
            migrationBuilder.DropColumn(name: "interest_period", table: "debts");
            migrationBuilder.DropColumn(name: "needs_review", table: "debts");
            migrationBuilder.DropColumn(name: "payment_mode", table: "debts");

            migrationBuilder.Sql("UPDATE debts SET payoff_date = CURRENT_DATE WHERE payoff_date IS NULL;");

            migrationBuilder.AlterColumn<DateOnly>(
                name: "payoff_date",
                table: "debts",
                type: "date",
                nullable: false,
                oldClrType: typeof(DateOnly),
                oldType: "date",
                oldNullable: true);

            migrationBuilder.RenameColumn(
                name: "payoff_date",
                table: "debts",
                newName: "due_date");

            migrationBuilder.AlterColumn<decimal>(
                name: "interest_rate",
                table: "debts",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(18,4)",
                oldPrecision: 18,
                oldScale: 4,
                oldNullable: true);
        }
    }
}
