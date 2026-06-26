using MediatR;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Domain.Entities;
using QuiteUp.Domain.Enums;

namespace QuiteUp.Application.Features.Auth.Commands.ResendVerification;

public class ResendVerificationEmailCommandHandler(
    IApplicationDbContext context,
    ITokenService tokenService,
    IEmailService emailService) : IRequestHandler<ResendVerificationEmailCommand>
{
    public async Task Handle(ResendVerificationEmailCommand request, CancellationToken cancellationToken)
    {
        var user = await context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email.ToLowerInvariant() && u.Status == UserStatus.Inactive, cancellationToken);

        if (user is null) return;

        var recentCount = await context.EmailVerificationTokens
            .CountAsync(t => t.UserId == user.Id && t.CreatedAt >= DateTime.UtcNow.AddHours(-1), cancellationToken);

        if (recentCount >= 3) return;

        var (token, tokenHash) = tokenService.GenerateSecureToken();
        context.EmailVerificationTokens.Add(new EmailVerificationToken
        {
            UserId = user.Id,
            TokenHash = tokenHash,
            ExpiresAt = DateTime.UtcNow.AddHours(24)
        });

        await context.SaveChangesAsync(cancellationToken);
        await emailService.SendEmailVerificationAsync(user.Email, user.Name, token, cancellationToken);
    }
}
