using NetDevPack.SimpleMediator;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Budgets.DTOs;

namespace QuiteUp.Application.Features.Budgets.Commands.CreateBudget;

public record CreateBudgetCommand(
    long CategoryId,
    decimal Amount,
    int Month,
    int Year
) : IRequest<Result<BudgetDto>>;
