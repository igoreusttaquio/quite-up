using NetDevPack.SimpleMediator;
using QuiteUp.Application.Common.Results;

namespace QuiteUp.Application.Features.Budgets.Commands.DeleteBudget;

public record DeleteBudgetCommand(long Id) : IRequest<Result>;
