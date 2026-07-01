using NetDevPack.SimpleMediator;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.FinancialGoals.DTOs;

namespace QuiteUp.Application.Features.FinancialGoals.Queries.GetFinancialGoals;

public record GetFinancialGoalsQuery(bool? IsCompleted = null) : IRequest<Result<IReadOnlyList<FinancialGoalDto>>>;
