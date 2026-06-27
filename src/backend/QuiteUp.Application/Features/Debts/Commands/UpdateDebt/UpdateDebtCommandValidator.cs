using FluentValidation;

namespace QuiteUp.Application.Features.Debts.Commands.UpdateDebt;

public class UpdateDebtCommandValidator : AbstractValidator<UpdateDebtCommand>
{
    public UpdateDebtCommandValidator()
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
