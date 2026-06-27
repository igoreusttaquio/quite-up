namespace QuiteUp.Application.Features.FinancialGoals.DTOs;

public record FinancialGoalDto(
    string Id,
    string Name,
    decimal TargetAmount,
    decimal CurrentAmount,
    decimal ProgressPercent,
    DateOnly? TargetDate,
    bool IsCompleted,
    DateTime CreatedAt
);
