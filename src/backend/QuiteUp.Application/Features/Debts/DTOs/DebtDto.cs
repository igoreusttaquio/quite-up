using QuiteUp.Domain.Enums;

namespace QuiteUp.Application.Features.Debts.DTOs;

public record NextInstallmentDto(int Number, decimal Amount, DateOnly DueDate);

public record DebtDto(
    string Id,
    string Name,
    DebtType Type,
    decimal TotalAmount,
    decimal PaidAmount,
    decimal RemainingAmount,
    decimal? InterestRate,
    InterestPeriod InterestPeriod,
    DebtPaymentMode PaymentMode,
    int? InstallmentCount,
    decimal? InstallmentAmount,
    int InitialPaidInstallments,
    int? DueDay,
    DateOnly? FirstInstallmentDate,
    // Parcelado: previsão de quitação (calculada). Sem parcelas: "quitar até".
    DateOnly? PayoffDate,
    bool IsPaid,
    string? Notes,
    bool NeedsReview,
    // onTrack | dueSoon | overdue | paid
    string Status,
    int? StatusDays,
    int? PaidInstallments,
    NextInstallmentDto? NextInstallment,
    DateOnly? NextDueDate,
    DateTime CreatedAt
);

public record InstallmentDto(int Number, decimal Amount, DateOnly DueDate, string Status, decimal RemainingAmount);
