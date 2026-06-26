using System.Security.Cryptography;
using System.Text;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Domain.Enums;

namespace QuiteUp.Application.Features.Auth.Commands.VerifyEmail;

public class VerifyEmailCommandHandler(IApplicationDbContext context) : IRequestHandler<VerifyEmailCommand, Result>
{
    public async Task<Result> Handle(VerifyEmailCommand request, CancellationToken cancellationToken)
    {
        var tokenHash = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(request.Token)));

        var verificationToken = await context.EmailVerificationTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash, cancellationToken);

        if (verificationToken is null || verificationToken.IsUsed || verificationToken.ExpiresAt < DateTime.UtcNow)
            return Result.Failure(Error.InvalidToken);

        verificationToken.IsUsed = true;
        verificationToken.User.Status = UserStatus.Active;

        await context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
