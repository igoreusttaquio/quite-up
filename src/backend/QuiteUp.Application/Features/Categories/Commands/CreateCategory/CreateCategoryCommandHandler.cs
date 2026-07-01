using NetDevPack.SimpleMediator;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Categories.DTOs;
using QuiteUp.Domain.Entities;

namespace QuiteUp.Application.Features.Categories.Commands.CreateCategory;

public class CreateCategoryCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser,
    IIdEncoder idEncoder) : IRequestHandler<CreateCategoryCommand, Result<CategoryDto>>
{
    public async Task<Result<CategoryDto>> Handle(CreateCategoryCommand request, CancellationToken cancellationToken)
    {
        var category = new Category
        {
            UserId = currentUser.UserId!.Value,
            Name = request.Name,
            Type = request.Type,
            Icon = request.Icon,
            Color = request.Color,
            IsDefault = false
        };

        context.Categories.Add(category);
        await context.SaveChangesAsync(cancellationToken);

        return Result<CategoryDto>.Success(new CategoryDto(
            idEncoder.Encode(category.Id),
            category.Name,
            category.Type,
            category.Icon,
            category.Color,
            category.IsDefault));
    }
}
