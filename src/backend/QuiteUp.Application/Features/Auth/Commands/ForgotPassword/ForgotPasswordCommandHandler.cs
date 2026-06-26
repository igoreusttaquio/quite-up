using MediatR;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Domain.Entities;

namespace QuiteUp.Application.Features.Auth.Commands.ForgotPassword;

public class ForgotPasswordCommandHandler(
    IApplicationDbContext context,
    ITokenService tokenService,
    IEmailService emailService) : IRequestHandler<ForgotPasswordCommand>
{
    public async Task Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email.ToLowerInvariant(), cancellationToken);

        if (user is null) return;

        var recentCount = await context.PasswordResetTokens
            .CountAsync(t => t.UserId == user.Id && t.CreatedAt >= DateTime.UtcNow.AddHours(-1), cancellationToken);

        if (recentCount >= 3) return;

        var (token, tokenHash) = tokenService.GenerateSecureToken();
        context.PasswordResetTokens.Add(new PasswordResetToken
        {
            UserId = user.Id,
            TokenHash = tokenHash,
            ExpiresAt = DateTime.UtcNow.AddHours(1)
        });

        await context.SaveChangesAsync(cancellationToken);
        await emailService.SendPasswordResetAsync(user.Email, user.Name, token, cancellationToken);
    }
}
