using NetDevPack.SimpleMediator;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Transactions.DTOs;

namespace QuiteUp.Application.Features.Transactions.Commands.UpdateTransaction;

public record UpdateTransactionCommand(
    long Id,
    decimal Amount,
    DateOnly Date,
    long? CategoryId,
    string? Description
) : IRequest<Result<TransactionDto>>;
