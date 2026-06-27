using QuiteUp.Domain.Enums;

namespace QuiteUp.Application.Features.Debts.DTOs;

public record DebtDto(
    string Id,
    string Name,
    DebtType Type,
    decimal TotalAmount,
    decimal PaidAmount,
    decimal RemainingAmount,
    decimal? InterestRate,
    DateOnly DueDate,
    bool IsPaid,
    string? Notes,
    DateTime CreatedAt
);
