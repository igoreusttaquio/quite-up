using NetDevPack.SimpleMediator;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Categories.DTOs;

namespace QuiteUp.Application.Features.Categories.Commands.UpdateCategory;

public class UpdateCategoryCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser,
    IIdEncoder idEncoder) : IRequestHandler<UpdateCategoryCommand, Result<CategoryDto>>
{
    public async Task<Result<CategoryDto>> Handle(UpdateCategoryCommand request, CancellationToken cancellationToken)
    {
        var category = await context.Categories
            .FirstOrDefaultAsync(c => c.Id == request.Id && c.UserId == currentUser.UserId, cancellationToken);

        if (category is null)
            return Result<CategoryDto>.Failure(Error.NotFound);

        if (category.IsDefault)
            return Result<CategoryDto>.Failure(Error.Forbidden);

        category.Name = request.Name;
        category.Icon = request.Icon;
        category.Color = request.Color;

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
