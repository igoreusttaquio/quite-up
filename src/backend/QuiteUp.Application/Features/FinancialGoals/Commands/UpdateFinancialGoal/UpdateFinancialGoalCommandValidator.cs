using FluentValidation;

namespace QuiteUp.Application.Features.FinancialGoals.Commands.UpdateFinancialGoal;

public class UpdateFinancialGoalCommandValidator : AbstractValidator<UpdateFinancialGoalCommand>
{
    public UpdateFinancialGoalCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Nome é obrigatório.");

        RuleFor(x => x.TargetAmount)
            .GreaterThan(0).WithMessage("Valor alvo deve ser maior que zero.");
    }
}
