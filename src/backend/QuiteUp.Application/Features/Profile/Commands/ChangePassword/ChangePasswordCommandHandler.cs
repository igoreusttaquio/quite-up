using NetDevPack.SimpleMediator;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;

namespace QuiteUp.Application.Features.Profile.Commands.ChangePassword;

public class ChangePasswordCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser,
    IPasswordHasher passwordHasher) : IRequestHandler<ChangePasswordCommand, Result>
{
    public async Task<Result> Handle(ChangePasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await context.Users
            .FirstOrDefaultAsync(u => u.Id == currentUser.UserId, cancellationToken);

        if (user is null)
            return Result.Failure(Error.NotFound);

        if (!passwordHasher.Verify(request.CurrentPassword, user.PasswordHash))
            return Result.Failure(Error.WrongPassword);

        if (request.NewPassword != request.ConfirmNewPassword)
            return Result.Failure(Error.PasswordMismatch);

        user.PasswordHash = passwordHasher.Hash(request.NewPassword);

        var refreshTokens = await context.RefreshTokens
            .Where(rt => rt.UserId == user.Id && !rt.IsRevoked)
            .ToListAsync(cancellationToken);

        foreach (var token in refreshTokens)
            token.IsRevoked = true;

        await context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
