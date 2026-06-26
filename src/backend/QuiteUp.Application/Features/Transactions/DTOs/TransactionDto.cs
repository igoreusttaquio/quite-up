using QuiteUp.Domain.Enums;

namespace QuiteUp.Application.Features.Transactions.DTOs;

public record TransactionDto(
    string Id,
    TransactionType Type,
    decimal Amount,
    DateOnly Date,
    string? Description,
    string AccountId,
    string AccountName,
    string? CategoryId,
    string? CategoryName,
    string? DestinationAccountId,
    string? DestinationAccountName,
    DateTime CreatedAt
);
