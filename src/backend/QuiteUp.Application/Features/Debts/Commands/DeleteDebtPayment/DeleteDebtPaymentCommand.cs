using NetDevPack.SimpleMediator;
using QuiteUp.Application.Common.Results;

namespace QuiteUp.Application.Features.Debts.Commands.DeleteDebtPayment;

public record DeleteDebtPaymentCommand(long DebtId, long PaymentId) : IRequest<Result>;
