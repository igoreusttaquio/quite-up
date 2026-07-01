using NetDevPack.SimpleMediator;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Budgets.DTOs;

namespace QuiteUp.Application.Features.Budgets.Commands.UpdateBudget;

public record UpdateBudgetCommand(
    long Id,
    long CategoryId,
    decimal Amount,
    int Month,
    int Year
) : IRequest<Result<BudgetDto>>;
