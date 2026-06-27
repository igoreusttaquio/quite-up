using QuiteUp.Application.Features.Transactions.DTOs;

namespace QuiteUp.Application.Features.Dashboard.DTOs;

public record DashboardSummaryDto(
    decimal TotalBalance,
    decimal MonthlyIncome,
    decimal MonthlyExpenses,
    IReadOnlyList<TransactionDto> RecentTransactions
);
