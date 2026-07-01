using NetDevPack.SimpleMediator;
using QuiteUp.Application.Common.Results;

namespace QuiteUp.Application.Features.Debts.Commands.DeleteDebt;

public record DeleteDebtCommand(long Id) : IRequest<Result>;
