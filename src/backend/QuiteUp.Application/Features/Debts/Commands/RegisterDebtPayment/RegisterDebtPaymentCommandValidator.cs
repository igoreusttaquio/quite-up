using FluentValidation;

namespace QuiteUp.Application.Features.Debts.Commands.RegisterDebtPayment;

public class RegisterDebtPaymentCommandValidator : AbstractValidator<RegisterDebtPaymentCommand>
{
    public RegisterDebtPaymentCommandValidator()
    {
        RuleFor(x => x.DebtId)
            .NotEmpty().WithMessage("Dívida é obrigatória.");

        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("Valor do pagamento deve ser maior que zero.");

        RuleFor(x => x.PaymentDate)
            .NotEmpty().WithMessage("Data de pagamento é obrigatória.");

        RuleFor(x => x.Discount)
            .GreaterThanOrEqualTo(0).WithMessage("Desconto não pode ser negativo.");
    }
}
