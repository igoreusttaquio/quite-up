using MediatR;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.FinancialGoals.DTOs;

namespace QuiteUp.Application.Features.FinancialGoals.Commands.UpdateFinancialGoal;

public record UpdateFinancialGoalCommand(
    long Id,
    string Name,
    decimal TargetAmount,
    DateOnly? TargetDate
) : IRequest<Result<FinancialGoalDto>>;
