using NetDevPack.SimpleMediator;
using QuiteUp.Application.Common.Results;

namespace QuiteUp.Application.Features.Transactions.Commands.DeleteTransaction;

public record DeleteTransactionCommand(long Id) : IRequest<Result>;
