using System.Security.Cryptography;
using System.Text;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Auth.DTOs;
using RefreshTokenEntity = QuiteUp.Domain.Entities.RefreshToken;

namespace QuiteUp.Application.Features.Auth.Commands.RefreshToken;

public class RefreshTokenCommandHandler(
    IApplicationDbContext context,
    ITokenService tokenService) : IRequestHandler<RefreshTokenCommand, Result<AuthResultDto>>
{
    public async Task<Result<AuthResultDto>> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        var tokenHash = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(request.RefreshToken)));

        var storedToken = await context.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash, cancellationToken);

        if (storedToken is null || storedToken.ExpiresAt < DateTime.UtcNow)
            return Result<AuthResultDto>.Failure(Error.InvalidToken);

        // Reuse detected — revoke all tokens for this user
        if (storedToken.IsRevoked)
        {
            var allTokens = await context.RefreshTokens
                .Where(rt => rt.UserId == storedToken.UserId && !rt.IsRevoked)
                .ToListAsync(cancellationToken);

            foreach (var t in allTokens) { t.IsRevoked = true; t.RevokedAt = DateTime.UtcNow; }
            await context.SaveChangesAsync(cancellationToken);
            return Result<AuthResultDto>.Failure(Error.InvalidToken);
        }

        storedToken.IsRevoked = true;
        storedToken.RevokedAt = DateTime.UtcNow;

        var user = storedToken.User;
        var accessToken = tokenService.GenerateAccessToken(user.Id, user.Email, user.Name);
        var (newRefreshToken, newTokenHash) = tokenService.GenerateRefreshToken();
        var expiresAt = DateTime.UtcNow.AddMinutes(tokenService.AccessTokenExpiryMinutes);

        context.RefreshTokens.Add(new RefreshTokenEntity
        {
            UserId = user.Id,
            TokenHash = newTokenHash,
            ExpiresAt = DateTime.UtcNow.AddDays(tokenService.RefreshTokenExpiryDays)
        });

        await context.SaveChangesAsync(cancellationToken);
        return Result<AuthResultDto>.Success(new AuthResultDto(accessToken, newRefreshToken, expiresAt));
    }
}
