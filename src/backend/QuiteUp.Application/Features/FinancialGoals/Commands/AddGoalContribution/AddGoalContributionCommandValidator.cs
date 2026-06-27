using FluentValidation;

namespace QuiteUp.Application.Features.FinancialGoals.Commands.AddGoalContribution;

public class AddGoalContributionCommandValidator : AbstractValidator<AddGoalContributionCommand>
{
    public AddGoalContributionCommandValidator()
    {
        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("Valor deve ser maior que zero.");

        RuleFor(x => x.Date)
            .NotEmpty().WithMessage("Data é obrigatória.");
    }
}
