using MediatR;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Debts.DTOs;

namespace QuiteUp.Application.Features.Debts.Commands.RegisterDebtPayment;

public record RegisterDebtPaymentCommand(
    long DebtId,
    decimal Amount,
    DateOnly PaymentDate,
    bool IsEarlyPayment,
    decimal Discount,
    string? Notes
) : IRequest<Result<DebtPaymentDto>>;
