using MediatR;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;

namespace QuiteUp.Application.Features.Categories.Commands.DeleteCategory;

public class DeleteCategoryCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser) : IRequestHandler<DeleteCategoryCommand, Result>
{
    public async Task<Result> Handle(DeleteCategoryCommand request, CancellationToken cancellationToken)
    {
        var category = await context.Categories
            .FirstOrDefaultAsync(c => c.Id == request.Id && c.UserId == currentUser.UserId, cancellationToken);

        if (category is null)
            return Result.Failure(Error.NotFound);

        if (category.IsDefault)
            return Result.Failure(Error.Forbidden);

        var hasTransactions = await context.Transactions
            .AnyAsync(t => t.CategoryId == request.Id, cancellationToken);

        if (hasTransactions)
            return Result.Failure(Error.CannotDelete);

        context.Categories.Remove(category);
        await context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
