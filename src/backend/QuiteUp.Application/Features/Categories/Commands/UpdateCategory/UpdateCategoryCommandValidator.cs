using FluentValidation;

namespace QuiteUp.Application.Features.Categories.Commands.UpdateCategory;

public class UpdateCategoryCommandValidator : AbstractValidator<UpdateCategoryCommand>
{
    public UpdateCategoryCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Nome é obrigatório.")
            .MaximumLength(50).WithMessage("Nome deve ter no máximo 50 caracteres.");

        RuleFor(x => x.Icon)
            .NotEmpty().WithMessage("Ícone é obrigatório.")
            .MaximumLength(50).WithMessage("Ícone deve ter no máximo 50 caracteres.");

        RuleFor(x => x.Color)
            .NotEmpty().WithMessage("Cor é obrigatória.")
            .Matches(@"^#[0-9A-Fa-f]{6}$").WithMessage("Cor deve ser um código hexadecimal válido (ex: #FF5733).");
    }
}
