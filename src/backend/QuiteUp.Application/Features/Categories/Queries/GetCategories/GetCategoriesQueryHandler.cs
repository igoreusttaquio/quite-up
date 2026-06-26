using MediatR;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Categories.DTOs;

namespace QuiteUp.Application.Features.Categories.Queries.GetCategories;

public class GetCategoriesQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser,
    IIdEncoder idEncoder) : IRequestHandler<GetCategoriesQuery, Result<IReadOnlyList<CategoryDto>>>
{
    public async Task<Result<IReadOnlyList<CategoryDto>>> Handle(GetCategoriesQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId!.Value;

        var query = context.Categories
            .Where(c => c.UserId == null || c.UserId == userId);

        if (request.Type.HasValue)
            query = query.Where(c => c.Type == request.Type.Value);

        var categories = await query
            .OrderBy(c => c.IsDefault ? 0 : 1)
            .ThenBy(c => c.Name)
            .ToListAsync(cancellationToken);

        var dtos = categories.Select(c => new CategoryDto(
            idEncoder.Encode(c.Id),
            c.Name,
            c.Type,
            c.Icon,
            c.Color,
            c.IsDefault)).ToList();

        return Result<IReadOnlyList<CategoryDto>>.Success(dtos);
    }
}
