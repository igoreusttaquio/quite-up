namespace QuiteUp.Application.Features.Debts.DTOs;

public record DebtPaymentDto(
    string Id,
    string DebtId,
    string DebtName,
    decimal Amount,
    DateOnly PaymentDate,
    bool IsEarlyPayment,
    decimal Discount,
    string? Notes,
    string? AccountId,
    string? AccountName,
    DateTime CreatedAt
);
