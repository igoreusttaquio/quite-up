using NetDevPack.SimpleMediator;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Budgets.DTOs;

namespace QuiteUp.Application.Features.Budgets.Queries.GetBudgets;

public record GetBudgetsQuery(int? Month, int? Year) : IRequest<Result<IReadOnlyList<BudgetDto>>>;
