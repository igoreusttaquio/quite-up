using MediatR;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.FinancialGoals.DTOs;

namespace QuiteUp.Application.Features.FinancialGoals.Commands.AddGoalContribution;

public record AddGoalContributionCommand(
    long FinancialGoalId,
    decimal Amount,
    DateOnly Date,
    string? Notes
) : IRequest<Result<GoalContributionDto>>;
