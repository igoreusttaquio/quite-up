using FluentValidation;

namespace QuiteUp.Application.Features.FinancialGoals.Commands.CreateFinancialGoal;

public class CreateFinancialGoalCommandValidator : AbstractValidator<CreateFinancialGoalCommand>
{
    public CreateFinancialGoalCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Nome é obrigatório.");

        RuleFor(x => x.TargetAmount)
            .GreaterThan(0).WithMessage("Valor alvo deve ser maior que zero.");
    }
}
