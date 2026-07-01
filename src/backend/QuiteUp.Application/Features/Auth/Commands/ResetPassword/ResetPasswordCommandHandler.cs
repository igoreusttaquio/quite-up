using System.Security.Cryptography;
using System.Text;
using NetDevPack.SimpleMediator;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;

namespace QuiteUp.Application.Features.Auth.Commands.ResetPassword;

public class ResetPasswordCommandHandler(
    IApplicationDbContext context,
    IPasswordHasher passwordHasher) : IRequestHandler<ResetPasswordCommand, Result>
{
    public async Task<Result> Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
    {
        var tokenHash = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(request.Token)));

        var resetToken = await context.PasswordResetTokens
            .Include(t => t.User)
            .ThenInclude(u => u.RefreshTokens)
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash, cancellationToken);

        if (resetToken is null || resetToken.IsUsed || resetToken.ExpiresAt < DateTime.UtcNow)
            return Result.Failure(Error.InvalidToken);

        var user = resetToken.User;
        user.PasswordHash = passwordHasher.Hash(request.NewPassword);
        resetToken.IsUsed = true;

        foreach (var rt in user.RefreshTokens.Where(rt => !rt.IsRevoked))
        {
            rt.IsRevoked = true;
            rt.RevokedAt = DateTime.UtcNow;
        }

        await context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
