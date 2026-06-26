using System.Security.Cryptography;
using System.Text;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;

namespace QuiteUp.Application.Features.Auth.Commands.Logout;

public class LogoutCommandHandler(IApplicationDbContext context) : IRequestHandler<LogoutCommand>
{
    public async Task Handle(LogoutCommand request, CancellationToken cancellationToken)
    {
        var tokenHash = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(request.RefreshToken)));

        var storedToken = await context.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash && !rt.IsRevoked, cancellationToken);

        if (storedToken is null) return;

        storedToken.IsRevoked = true;
        storedToken.RevokedAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);
    }
}
