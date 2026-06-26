using FluentValidation;

namespace QuiteUp.Application.Features.Transactions.Commands.UpdateTransaction;

public class UpdateTransactionCommandValidator : AbstractValidator<UpdateTransactionCommand>
{
    public UpdateTransactionCommandValidator()
    {
        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("Valor deve ser maior que zero.");

        RuleFor(x => x.Description)
            .MaximumLength(255).WithMessage("Descrição deve ter no máximo 255 caracteres.")
            .When(x => x.Description is not null);
    }
}
