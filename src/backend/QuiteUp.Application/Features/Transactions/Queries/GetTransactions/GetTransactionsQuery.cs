using MediatR;
using QuiteUp.Application.Common.Models;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Transactions.DTOs;
using QuiteUp.Domain.Enums;

namespace QuiteUp.Application.Features.Transactions.Queries.GetTransactions;

public record GetTransactionsQuery(
    long? AccountId = null,
    TransactionType? Type = null,
    long? CategoryId = null,
    DateOnly? StartDate = null,
    DateOnly? EndDate = null,
    int Page = 1,
    int PageSize = 20
) : IRequest<Result<PagedResult<TransactionDto>>>;
