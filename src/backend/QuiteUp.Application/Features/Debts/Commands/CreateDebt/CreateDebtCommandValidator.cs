using FluentValidation;

namespace QuiteUp.Application.Features.Debts.Commands.CreateDebt;

public class CreateDebtCommandValidator : AbstractValidator<CreateDebtCommand>
{
    public CreateDebtCommandValidator()
    {
        RuleFor(x => x.Input).SetValidator(new DebtInputValidator());
    }
}
