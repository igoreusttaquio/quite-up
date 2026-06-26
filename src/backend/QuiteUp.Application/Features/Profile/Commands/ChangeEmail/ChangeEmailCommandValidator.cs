using FluentValidation;

namespace QuiteUp.Application.Features.Profile.Commands.ChangeEmail;

public class ChangeEmailCommandValidator : AbstractValidator<ChangeEmailCommand>
{
    public ChangeEmailCommandValidator()
    {
        RuleFor(x => x.NewEmail)
            .NotEmpty().WithMessage("Novo email é obrigatório.")
            .EmailAddress().WithMessage("Email inválido.")
            .MaximumLength(200).WithMessage("Email deve ter no máximo 200 caracteres.");

        RuleFor(x => x.CurrentPassword)
            .NotEmpty().WithMessage("Senha atual é obrigatória.");
    }
}
