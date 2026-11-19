using QuiteUp.Application.Features.Transactions.DTOs;

namespace QuiteUp.Application.Features.Dashboard.DTOs;

public record DashboardSummaryDto(
    DateOnly StartDate,
    DateOnly EndDate,
    decimal TotalBalance,
    decimal PeriodIncome,
    decimal PeriodExpenses,
    string SeriesGranularity,
    IReadOnlyList<DashboardSeriesPointDto> Series,
    IReadOnlyList<DashboardCategoryItemDto> ExpensesByCategory,
    IReadOnlyList<DashboardCategoryItemDto> IncomeByCategory,
    IReadOnlyList<TransactionDto> RecentTransactions
);

public record DashboardSeriesPointDto(
    DateOnly Date,
    decimal Income,
    decimal Expenses,
    decimal Net
);

public record DashboardCategoryItemDto(
    string? CategoryId,
    string CategoryName,
    string? Color,
    decimal TotalAmount,
    int TransactionCount,
    decimal Percentage
);
