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
    string? TransactionId,
    string? AttachmentId,
    string? AttachmentFileName,
    string? AttachmentContentType,
    long? AttachmentFileSize,
    DateTime CreatedAt
);
