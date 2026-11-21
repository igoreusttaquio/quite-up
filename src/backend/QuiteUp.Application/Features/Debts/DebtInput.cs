using FluentValidation;
using QuiteUp.Domain.Entities;
using QuiteUp.Domain.Enums;

namespace QuiteUp.Application.Features.Debts;

/// <summary>Campos editáveis de uma dívida (criar/editar).</summary>
public record DebtInput(
    string Name,
    DebtType Type,
    decimal TotalAmount,
    DebtPaymentMode PaymentMode,
    int? InstallmentCount,
    decimal? InstallmentAmount,
    int InitialPaidInstallments,
    int? DueDay,
    DateOnly? FirstInstallmentDate,
    DateOnly? PayoffDate,
    decimal? InterestRate,
    InterestPeriod InterestPeriod,
    string? Notes)
{
    /// <summary>Aplica os campos à entidade (zera os que não se aplicam ao modo de pagamento).</summary>
    public void ApplyTo(Debt debt)
    {
        var installments = PaymentMode == DebtPaymentMode.Installments;
        debt.Name = Name.Trim();
        debt.Type = Type;
        debt.TotalAmount = TotalAmount;
        debt.PaymentMode = PaymentMode;
        debt.InstallmentCount = installments ? InstallmentCount : null;
        debt.InstallmentAmount = installments ? InstallmentAmount : null;
        debt.InitialPaidInstallments = installments ? InitialPaidInstallments : 0;
        debt.DueDay = DueDay;
        debt.FirstInstallmentDate = installments ? FirstInstallmentDate : null;
        debt.InterestRate = InterestRate;
        debt.InterestPeriod = InterestPeriod;
        debt.Notes = string.IsNullOrWhiteSpace(Notes) ? null : Notes.Trim();
        // Parcelado: guarda a previsão calculada; sem parcelas: o "quitar até" informado.
        debt.PayoffDate = installments ? DebtSchedule.ComputePayoffDate(debt) : PayoffDate;
        debt.NeedsReview = false;
    }

    /// <summary>"Pago" = pagamentos registrados + parcelas pagas antes do app.</summary>
    public static void RecomputePaid(Debt debt, decimal paymentsTotal)
    {
        var initial = debt.PaymentMode == DebtPaymentMode.Installments
            ? debt.InitialPaidInstallments * (debt.InstallmentAmount ?? 0)
            : 0;
        debt.PaidAmount = paymentsTotal + initial;
        debt.IsPaid = debt.PaidAmount >= debt.TotalAmount;
    }
}

public class DebtInputValidator : AbstractValidator<DebtInput>
{
    public DebtInputValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Nome é obrigatório.")
            .MaximumLength(100).WithMessage("Nome deve ter no máximo 100 caracteres.");
        RuleFor(x => x.Type).IsInEnum().WithMessage("Tipo inválido.");
        RuleFor(x => x.PaymentMode).IsInEnum().WithMessage("Forma de pagamento inválida.");
        RuleFor(x => x.InterestPeriod).IsInEnum().WithMessage("Período de juros inválido.");
        RuleFor(x => x.TotalAmount).GreaterThan(0).WithMessage("Valor total deve ser maior que zero.");
        RuleFor(x => x.DueDay)
            .InclusiveBetween(1, 31).WithMessage("Dia de vencimento deve ser entre 1 e 31.")
            .When(x => x.DueDay.HasValue);
        RuleFor(x => x.InterestRate)
            .InclusiveBetween(0, 1000).WithMessage("Taxa de juros inválida.")
            .When(x => x.InterestRate.HasValue);
        RuleFor(x => x.Notes).MaximumLength(500).WithMessage("Observações devem ter no máximo 500 caracteres.");

        When(x => x.PaymentMode == DebtPaymentMode.Installments, () =>
        {
            RuleFor(x => x.InstallmentCount)
                .NotNull().WithMessage("Informe o número de parcelas.")
                .InclusiveBetween(1, 600).WithMessage("Número de parcelas deve ser entre 1 e 600.");
            RuleFor(x => x.InstallmentAmount)
                .NotNull().WithMessage("Informe o valor da parcela.")
                .GreaterThan(0).WithMessage("Valor da parcela deve ser maior que zero.");
            RuleFor(x => x.DueDay).NotNull().WithMessage("Informe o dia de vencimento.");
            RuleFor(x => x.FirstInstallmentDate).NotNull().WithMessage("Informe a data da 1ª parcela.");
            RuleFor(x => x.InitialPaidInstallments)
                .GreaterThanOrEqualTo(0).WithMessage("Parcelas já pagas não pode ser negativo.")
                .LessThanOrEqualTo(x => x.InstallmentCount ?? 0).WithMessage("Parcelas já pagas não pode passar do total de parcelas.");
        });
    }
}
