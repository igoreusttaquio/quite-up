using FluentValidation;

namespace QuiteUp.Application.Features.Auth.Commands.ResetPassword;

public class ResetPasswordCommandValidator : AbstractValidator<ResetPasswordCommand>
{
    public ResetPasswordCommandValidator()
    {
        RuleFor(x => x.Token).NotEmpty();

        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("Senha é obrigatória.")
            .MinimumLength(8).WithMessage("Senha deve ter ao menos 8 caracteres.")
            .Matches("[A-Z]").WithMessage("Senha deve conter ao menos uma letra maiúscula.")
            .Matches("[a-z]").WithMessage("Senha deve conter ao menos uma letra minúscula.")
            .Matches("[0-9]").WithMessage("Senha deve conter ao menos um número.");

        RuleFor(x => x.ConfirmPassword)
            .Equal(x => x.NewPassword).WithMessage("As senhas não conferem.");
    }
}
