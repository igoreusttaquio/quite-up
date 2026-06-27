using QuiteUp.Domain.Enums;

namespace QuiteUp.Application.Features.Debts.DTOs;

public record SnowballStrategyItemDto(
    string DebtId,
    string Name,
    DebtType Type,
    decimal TotalAmount,
    decimal RemainingAmount,
    decimal MinimumPayment,
    DateOnly DueDate,
    int Order
);

public record SnowballStrategyDto(
    IReadOnlyList<SnowballStrategyItemDto> Debts,
    decimal TotalRemaining,
    int EstimatedMonthsToPayOff
);
