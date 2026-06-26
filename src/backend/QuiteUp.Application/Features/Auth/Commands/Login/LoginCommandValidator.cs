using FluentValidation;

namespace QuiteUp.Application.Features.Auth.Commands.Login;

public class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().WithMessage("Email inválido.");
        RuleFor(x => x.Password).NotEmpty().WithMessage("Senha é obrigatória.");
    }
}
