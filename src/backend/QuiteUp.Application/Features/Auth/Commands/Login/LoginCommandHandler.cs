using NetDevPack.SimpleMediator;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Auth.DTOs;
using QuiteUp.Domain.Entities;
using QuiteUp.Domain.Enums;
using RefreshTokenEntity = QuiteUp.Domain.Entities.RefreshToken;

namespace QuiteUp.Application.Features.Auth.Commands.Login;

public class LoginCommandHandler(
    IApplicationDbContext context,
    IPasswordHasher passwordHasher,
    ITokenService tokenService) : IRequestHandler<LoginCommand, Result<AuthResultDto>>
{
    public async Task<Result<AuthResultDto>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var user = await context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email.ToLowerInvariant(), cancellationToken);

        if (user is null)
            return Result<AuthResultDto>.Failure(Error.InvalidCredentials);

        if (user.LockedUntil.HasValue && user.LockedUntil > DateTime.UtcNow)
            return Result<AuthResultDto>.Failure(Error.AccountLocked);

        if (!passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            user.FailedLoginAttempts++;
            if (user.FailedLoginAttempts >= 5)
            {
                user.LockedUntil = DateTime.UtcNow.AddMinutes(15);
                user.FailedLoginAttempts = 0;
            }
            await context.SaveChangesAsync(cancellationToken);
            return Result<AuthResultDto>.Failure(Error.InvalidCredentials);
        }

        if (user.Status == UserStatus.Inactive)
            return Result<AuthResultDto>.Failure(Error.AccountNotActive);

        user.FailedLoginAttempts = 0;
        user.LockedUntil = null;

        var accessToken = tokenService.GenerateAccessToken(user.Id, user.Email, user.Name);
        var (refreshToken, refreshTokenHash) = tokenService.GenerateRefreshToken();
        var expiresAt = DateTime.UtcNow.AddMinutes(15);

        context.RefreshTokens.Add(new RefreshTokenEntity
        {
            UserId = user.Id,
            TokenHash = refreshTokenHash,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        });

        await context.SaveChangesAsync(cancellationToken);

        return Result<AuthResultDto>.Success(new AuthResultDto(accessToken, refreshToken, expiresAt));
    }
}
