namespace QuiteUp.Application.Features.Budgets.DTOs;

public record BudgetDto(
    string Id,
    string CategoryId,
    string? CategoryName,
    decimal Amount,
    decimal Spent,
    decimal Remaining,
    int Month,
    int Year,
    DateTime CreatedAt
);
