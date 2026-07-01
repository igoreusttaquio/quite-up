using NetDevPack.SimpleMediator;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;

namespace QuiteUp.Application.Features.Accounts.Commands.DeactivateAccount;

public class DeactivateAccountCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser) : IRequestHandler<DeactivateAccountCommand, Result>
{
    public async Task<Result> Handle(DeactivateAccountCommand request, CancellationToken cancellationToken)
    {
        var account = await context.Accounts
            .FirstOrDefaultAsync(a => a.Id == request.Id && a.UserId == currentUser.UserId, cancellationToken);

        if (account is null)
            return Result.Failure(Error.NotFound);

        account.IsActive = false;
        await context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
