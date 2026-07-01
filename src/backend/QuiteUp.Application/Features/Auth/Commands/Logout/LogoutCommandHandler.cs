using System.Security.Cryptography;
using System.Text;
using NetDevPack.SimpleMediator;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;

namespace QuiteUp.Application.Features.Auth.Commands.Logout;

public class LogoutCommandHandler(IApplicationDbContext context) : IRequestHandler<LogoutCommand, Result>
{
    public async Task<Result> Handle(LogoutCommand request, CancellationToken cancellationToken)
    {
        var tokenHash = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(request.RefreshToken)));

        var storedToken = await context.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash && !rt.IsRevoked, cancellationToken);

        if (storedToken is null) return Result.Failure(Error.NotFound);

        storedToken.IsRevoked = true;
        storedToken.RevokedAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
