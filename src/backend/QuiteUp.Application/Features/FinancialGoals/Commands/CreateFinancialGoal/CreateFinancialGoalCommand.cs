using MediatR;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.FinancialGoals.DTOs;

namespace QuiteUp.Application.Features.FinancialGoals.Commands.CreateFinancialGoal;

public record CreateFinancialGoalCommand(
    string Name,
    decimal TargetAmount,
    DateOnly? TargetDate
) : IRequest<Result<FinancialGoalDto>>;
