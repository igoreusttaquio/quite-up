using Microsoft.EntityFrameworkCore;
using NetDevPack.SimpleMediator;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Events;
using QuiteUp.Domain.Entities;

namespace QuiteUp.Application.Features.Auth.Commands.ForgotPassword;

public class ForgotPasswordCommandHandler(
    IApplicationDbContext context,
    ITokenService tokenService,
    IEventBus eventBus) : IRequestHandler<ForgotPasswordCommand, Result>
{
    public async Task<Result> Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email.ToLowerInvariant(), cancellationToken);

        if (user is null) return Result.Failure(Error.NotFound);

        var recentCount = await context.PasswordResetTokens
            .CountAsync(t => t.UserId == user.Id && t.CreatedAt >= DateTime.UtcNow.AddHours(-1), cancellationToken);

        if (recentCount >= 3) return Result.Failure(Error.TooManyRequests);

        var (token, tokenHash) = tokenService.GenerateSecureToken();
        context.PasswordResetTokens.Add(new PasswordResetToken
        {
            UserId = user.Id,
            TokenHash = tokenHash,
            ExpiresAt = DateTime.UtcNow.AddHours(1)
        });

        await context.SaveChangesAsync(cancellationToken);

        await eventBus.PublishAsync(
            new ForgotPasswordRequestedEvent(user.Email, user.Name, token),
            cancellationToken);

        return Result.Success();
    }
}
