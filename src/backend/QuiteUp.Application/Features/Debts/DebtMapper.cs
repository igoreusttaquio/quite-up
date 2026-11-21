using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Features.Debts.DTOs;
using QuiteUp.Domain.Entities;

namespace QuiteUp.Application.Features.Debts;

public static class DebtMapper
{
    public static DateOnly Today => DateOnly.FromDateTime(DateTime.UtcNow);

    private static string Camel(Enum value)
    {
        var s = value.ToString();
        return char.ToLowerInvariant(s[0]) + s[1..];
    }

    public static DebtDto ToDto(Debt d, IIdEncoder encoder)
    {
        var today = Today;
        var status = DebtSchedule.Status(d, today);
        return new DebtDto(
            encoder.Encode(d.Id),
            d.Name,
            d.Type,
            d.TotalAmount,
            d.PaidAmount,
            Math.Max(0, d.TotalAmount - d.PaidAmount),
            d.InterestRate,
            d.InterestPeriod,
            d.PaymentMode,
            d.InstallmentCount,
            d.InstallmentAmount,
            d.InitialPaidInstallments,
            d.DueDay,
            d.FirstInstallmentDate,
            DebtSchedule.ComputePayoffDate(d),
            d.IsPaid,
            d.Notes,
            d.NeedsReview,
            Camel(status.Kind),
            status.Days,
            status.PaidInstallments,
            status.NextInstallment is { } n ? new NextInstallmentDto(n.Number, n.RemainingAmount, n.DueDate) : null,
            status.NextDueDate,
            d.CreatedAt);
    }

    public static IReadOnlyList<InstallmentDto> Installments(Debt d) =>
        DebtSchedule.Installments(d, Today)
            .Select(i => new InstallmentDto(i.Number, i.Amount, i.DueDate, Camel(i.Status), i.RemainingAmount))
            .ToList();
}
