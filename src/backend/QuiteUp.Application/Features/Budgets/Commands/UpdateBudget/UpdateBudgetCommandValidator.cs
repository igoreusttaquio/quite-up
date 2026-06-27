using FluentValidation;

namespace QuiteUp.Application.Features.Budgets.Commands.UpdateBudget;

public class UpdateBudgetCommandValidator : AbstractValidator<UpdateBudgetCommand>
{
    public UpdateBudgetCommandValidator()
    {
        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("Valor deve ser maior que zero.");

        RuleFor(x => x.Month)
            .InclusiveBetween(1, 12).WithMessage("Mês inválido.");

        RuleFor(x => x.Year)
            .GreaterThanOrEqualTo(2020).WithMessage("Ano inválido.");
    }
}
