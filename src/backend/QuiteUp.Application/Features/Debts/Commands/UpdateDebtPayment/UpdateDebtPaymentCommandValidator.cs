using FluentValidation;

namespace QuiteUp.Application.Features.Debts.Commands.UpdateDebtPayment;

public class UpdateDebtPaymentCommandValidator : AbstractValidator<UpdateDebtPaymentCommand>
{
    public UpdateDebtPaymentCommandValidator()
    {
        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("Valor do pagamento deve ser maior que zero.");

        RuleFor(x => x.PaymentDate)
            .NotEmpty().WithMessage("Data de pagamento é obrigatória.");

        RuleFor(x => x.Discount)
            .GreaterThanOrEqualTo(0).WithMessage("Desconto não pode ser negativo.");

        RuleFor(x => x.Notes)
            .MaximumLength(500).WithMessage("Observações devem ter no máximo 500 caracteres.")
            .When(x => x.Notes is not null);
    }
}
