namespace QuiteUp.Application.Features.FinancialGoals.DTOs;

public record GoalContributionDto(
    string Id,
    string FinancialGoalId,
    decimal Amount,
    DateOnly Date,
    string? Notes,
    DateTime CreatedAt
);
