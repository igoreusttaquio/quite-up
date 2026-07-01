using NetDevPack.SimpleMediator;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Transactions.DTOs;
using QuiteUp.Domain.Enums;

namespace QuiteUp.Application.Features.Transactions.Commands.CreateTransaction;

public record CreateTransactionCommand(
    TransactionType Type,
    decimal Amount,
    DateOnly Date,
    long AccountId,
    long? CategoryId,
    long? DestinationAccountId,
    string? Description,
    long? DebtId = null
) : IRequest<Result<TransactionDto>>;
