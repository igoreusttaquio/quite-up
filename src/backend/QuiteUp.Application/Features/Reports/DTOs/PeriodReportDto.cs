using QuiteUp.Application.Features.Reports.DTOs;

namespace QuiteUp.Application.Features.Reports.DTOs;

public record PeriodReportDto(
    DateOnly StartDate,
    DateOnly EndDate,
    decimal TotalIncome,
    decimal TotalExpenses,
    decimal NetBalance,
    IReadOnlyList<CategoryReportDto> ExpensesByCategory
);
