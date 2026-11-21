using FluentValidation;

namespace QuiteUp.Application.Features.Debts.Commands.UpdateDebt;

public class UpdateDebtCommandValidator : AbstractValidator<UpdateDebtCommand>
{
    public UpdateDebtCommandValidator()
    {
        RuleFor(x => x.Input).SetValidator(new DebtInputValidator());
    }
}
