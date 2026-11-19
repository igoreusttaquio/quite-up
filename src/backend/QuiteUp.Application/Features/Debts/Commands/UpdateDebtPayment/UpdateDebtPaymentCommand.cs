using NetDevPack.SimpleMediator;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Debts.DTOs;

namespace QuiteUp.Application.Features.Debts.Commands.UpdateDebtPayment;

public record UpdateDebtPaymentCommand(
    long DebtId,
    long PaymentId,
    decimal Amount,
    DateOnly PaymentDate,
    bool IsEarlyPayment,
    decimal Discount,
    string? Notes,
    long? AccountId
) : IRequest<Result<DebtPaymentDto>>;
