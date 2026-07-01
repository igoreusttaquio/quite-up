using NetDevPack.SimpleMediator;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;

namespace QuiteUp.Application.Features.Profile.Commands.DeleteUserAccount;

public class DeleteUserAccountCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser,
    IPasswordHasher passwordHasher) : IRequestHandler<DeleteUserAccountCommand, Result>
{
    public async Task<Result> Handle(DeleteUserAccountCommand request, CancellationToken cancellationToken)
    {
        var user = await context.Users
            .FirstOrDefaultAsync(u => u.Id == currentUser.UserId, cancellationToken);

        if (user is null)
            return Result.Failure(Error.NotFound);

        if (!passwordHasher.Verify(request.Password, user.PasswordHash))
            return Result.Failure(Error.WrongPassword);

        context.Users.Remove(user);
        await context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
