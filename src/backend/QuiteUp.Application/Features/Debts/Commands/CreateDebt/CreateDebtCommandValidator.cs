using FluentValidation;

namespace QuiteUp.Application.Features.Debts.Commands.CreateDebt;

public class CreateDebtCommandValidator : AbstractValidator<CreateDebtCommand>
{
    public CreateDebtCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Nome é obrigatório.")
            .MaximumLength(100).WithMessage("Nome deve ter no máximo 100 caracteres.");

        RuleFor(x => x.TotalAmount)
            .GreaterThan(0).WithMessage("Valor total deve ser maior que zero.");

        RuleFor(x => x.DueDate)
            .NotEmpty().WithMessage("Data de vencimento é obrigatória.");
    }
}
