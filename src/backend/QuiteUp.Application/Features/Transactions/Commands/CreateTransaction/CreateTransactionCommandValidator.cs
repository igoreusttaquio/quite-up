using FluentValidation;
using QuiteUp.Domain.Enums;

namespace QuiteUp.Application.Features.Transactions.Commands.CreateTransaction;

public class CreateTransactionCommandValidator : AbstractValidator<CreateTransactionCommand>
{
    public CreateTransactionCommandValidator()
    {
        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("Valor deve ser maior que zero.");

        RuleFor(x => x.Type)
            .IsInEnum().WithMessage("Tipo de transação inválido.");

        RuleFor(x => x.AccountId)
            .GreaterThan(0).WithMessage("Conta é obrigatória.");

        RuleFor(x => x.DestinationAccountId)
            .NotNull().WithMessage("Conta de destino é obrigatória para transferências.")
            .NotEqual(x => (long?)x.AccountId).WithMessage("Conta de origem e destino não podem ser iguais.")
            .When(x => x.Type == TransactionType.Transfer);

        RuleFor(x => x.Description)
            .MaximumLength(255).WithMessage("Descrição deve ter no máximo 255 caracteres.")
            .When(x => x.Description is not null);
    }
}
