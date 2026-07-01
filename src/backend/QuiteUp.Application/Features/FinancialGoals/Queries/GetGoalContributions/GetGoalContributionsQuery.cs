using NetDevPack.SimpleMediator;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.FinancialGoals.DTOs;

namespace QuiteUp.Application.Features.FinancialGoals.Queries.GetGoalContributions;

public record GetGoalContributionsQuery(long FinancialGoalId) : IRequest<Result<IReadOnlyList<GoalContributionDto>>>;
