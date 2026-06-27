using MediatR;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Events;
using QuiteUp.Application.Features.Debts.DTOs;
using QuiteUp.Domain.Entities;

namespace QuiteUp.Application.Features.Debts.Commands.RegisterDebtPayment;

public class RegisterDebtPaymentCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser,
    IIdEncoder idEncoder,
    IEventBus eventBus) : IRequestHandler<RegisterDebtPaymentCommand, Result<DebtPaymentDto>>
{
    public async Task<Result<DebtPaymentDto>> Handle(RegisterDebtPaymentCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId!.Value;

        var debt = await context.Debts
            .FirstOrDefaultAsync(d => d.Id == request.DebtId && d.UserId == userId, cancellationToken);

        if (debt is null)
            return Result<DebtPaymentDto>.Failure(Error.NotFound);

        var payment = new DebtPayment
        {
            UserId = userId,
            DebtId = request.DebtId,
            Amount = request.Amount,
            PaymentDate = request.PaymentDate,
            IsEarlyPayment = request.IsEarlyPayment,
            Discount = request.Discount,
            Notes = request.Notes
        };

        context.DebtPayments.Add(payment);

        debt.PaidAmount += request.Amount;

        if (debt.PaidAmount >= debt.TotalAmount)
        {
            debt.IsPaid = true;

            // TODO: Gamification — check for progress milestones and award points
            await eventBus.PublishAsync(
                new DebtPaidOffEvent(userId, debt.Id, debt.Name, debt.TotalAmount), cancellationToken);
        }

        await context.SaveChangesAsync(cancellationToken);

        var dto = new DebtPaymentDto(
            idEncoder.Encode(payment.Id),
            idEncoder.Encode(debt.Id),
            debt.Name,
            payment.Amount,
            payment.PaymentDate,
            payment.IsEarlyPayment,
            payment.Discount,
            payment.Notes,
            payment.CreatedAt);

        return Result<DebtPaymentDto>.Success(dto);
    }
}
