using MediatR;
using QuiteUp.Application.Common.Results;

namespace QuiteUp.Application.Features.FinancialGoals.Commands.DeleteFinancialGoal;

public record DeleteFinancialGoalCommand(long Id) : IRequest<Result>;
