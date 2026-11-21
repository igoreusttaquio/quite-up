using QuiteUp.Domain.Entities;
using QuiteUp.Domain.Enums;

namespace QuiteUp.Application.Features.Debts;

public enum InstallmentStatus { Paid, Open, Overdue }

public enum DebtStatusKind { OnTrack, DueSoon, Overdue, Paid }

public record Installment(int Number, decimal Amount, DateOnly DueDate, InstallmentStatus Status, decimal RemainingAmount);

public record DebtStatus(
    DebtStatusKind Kind,
    // Dias em atraso (Overdue) ou até o vencimento (DueSoon/OnTrack com data).
    int? Days,
    int? PaidInstallments,
    Installment? NextInstallment,
    DateOnly? NextDueDate);

/// <summary>
/// Cronograma e status de uma dívida a partir dos campos do modelo.
/// Parcelas são cobertas em ordem pelo total pago (inclui parcelas já pagas antes do app).
/// </summary>
public static class DebtSchedule
{
    /// <summary>"Vence em X dias" quando faltam até 5 dias.</summary>
    public const int DueSoonDays = 5;

    private const decimal Tolerance = 0.005m;

    /// <summary>Dia `day` no mês de `reference`; se o mês não tem esse dia, o último dia do mês.</summary>
    public static DateOnly OnDay(DateOnly reference, int day)
    {
        var last = DateTime.DaysInMonth(reference.Year, reference.Month);
        return new DateOnly(reference.Year, reference.Month, Math.Clamp(day, 1, last));
    }

    /// <summary>Vencimento da parcela `number` (1-based).</summary>
    public static DateOnly DueDateOf(DateOnly firstInstallment, int dueDay, int number) =>
        OnDay(firstInstallment.AddDays(1 - firstInstallment.Day).AddMonths(number - 1), dueDay);

    /// <summary>Previsão de quitação: vencimento da última parcela.</summary>
    public static DateOnly? ComputePayoffDate(Debt debt) =>
        debt is { PaymentMode: DebtPaymentMode.Installments, InstallmentCount: > 0, FirstInstallmentDate: not null }
            ? DueDateOf(debt.FirstInstallmentDate.Value, debt.DueDay ?? debt.FirstInstallmentDate.Value.Day, debt.InstallmentCount.Value)
            : debt.PayoffDate;

    public static IReadOnlyList<Installment> Installments(Debt debt, DateOnly today)
    {
        if (debt is not { PaymentMode: DebtPaymentMode.Installments, InstallmentCount: > 0, InstallmentAmount: > 0, FirstInstallmentDate: not null })
            return [];

        var amount = debt.InstallmentAmount!.Value;
        var dueDay = debt.DueDay ?? debt.FirstInstallmentDate!.Value.Day;
        var list = new List<Installment>(debt.InstallmentCount!.Value);

        for (var n = 1; n <= debt.InstallmentCount; n++)
        {
            var due = DueDateOf(debt.FirstInstallmentDate!.Value, dueDay, n);
            var coveredUntil = amount * n;
            var remaining = Math.Max(0, coveredUntil - debt.PaidAmount);
            var paid = debt.IsPaid || remaining <= Tolerance;
            var status = paid ? InstallmentStatus.Paid : due < today ? InstallmentStatus.Overdue : InstallmentStatus.Open;
            // Parcela parcialmente coberta: falta só a diferença.
            list.Add(new Installment(n, amount, due, status, paid ? 0 : Math.Min(amount, remaining)));
        }

        return list;
    }

    public static DebtStatus Status(Debt debt, DateOnly today)
    {
        if (debt.IsPaid)
            return new DebtStatus(DebtStatusKind.Paid, null, debt.InstallmentCount, null, null);

        if (debt.PaymentMode == DebtPaymentMode.Installments)
        {
            var installments = Installments(debt, today);
            if (installments.Count > 0)
            {
                var paidCount = installments.Count(i => i.Status == InstallmentStatus.Paid);
                var oldestOverdue = installments.FirstOrDefault(i => i.Status == InstallmentStatus.Overdue);
                var next = installments.FirstOrDefault(i => i.Status != InstallmentStatus.Paid);

                if (oldestOverdue is not null)
                    return new DebtStatus(DebtStatusKind.Overdue, today.DayNumber - oldestOverdue.DueDate.DayNumber, paidCount, next, next?.DueDate);

                if (next is not null)
                {
                    var days = next.DueDate.DayNumber - today.DayNumber;
                    return new DebtStatus(days <= DueSoonDays ? DebtStatusKind.DueSoon : DebtStatusKind.OnTrack, days, paidCount, next, next.DueDate);
                }

                return new DebtStatus(DebtStatusKind.OnTrack, null, paidCount, null, null);
            }
        }

        // Sem parcelas fixas (ou dados incompletos): "quitar até" vencido = atraso.
        if (debt.PayoffDate is { } payoff && payoff < today)
            return new DebtStatus(DebtStatusKind.Overdue, today.DayNumber - payoff.DayNumber, null, null, payoff);

        if (debt.DueDay is { } day)
        {
            var thisMonth = OnDay(today, day);
            var nextDue = thisMonth >= today ? thisMonth : OnDay(today.AddMonths(1), day);
            var days = nextDue.DayNumber - today.DayNumber;
            return new DebtStatus(days <= DueSoonDays ? DebtStatusKind.DueSoon : DebtStatusKind.OnTrack, days, null, null, nextDue);
        }

        return new DebtStatus(DebtStatusKind.OnTrack, null, null, null, debt.PayoffDate);
    }

    /// <summary>Pagamento mínimo mensal para a Bola de Neve.</summary>
    public static decimal MonthlyPayment(Debt debt, DateOnly today)
    {
        var remaining = Math.Max(0, debt.TotalAmount - debt.PaidAmount);
        if (debt.PaymentMode == DebtPaymentMode.Installments && debt.InstallmentAmount is > 0)
            return Math.Min(debt.InstallmentAmount.Value, remaining);

        // Sem parcelas: divide o saldo até o "quitar até" (ou em 12 meses, se não houver).
        var months = debt.PayoffDate is { } payoff
            ? Math.Max(1, (payoff.Year - today.Year) * 12 + payoff.Month - today.Month)
            : 12;
        return Math.Round(remaining / months, 2);
    }
}
