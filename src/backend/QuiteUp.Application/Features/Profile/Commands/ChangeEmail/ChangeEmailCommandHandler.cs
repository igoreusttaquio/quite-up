using System.Security.Cryptography;
using NetDevPack.SimpleMediator;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Domain.Entities;

namespace QuiteUp.Application.Features.Profile.Commands.ChangeEmail;

public class ChangeEmailCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser,
    IPasswordHasher passwordHasher,
    IEmailService emailService) : IRequestHandler<ChangeEmailCommand, Result>
{
    public async Task<Result> Handle(ChangeEmailCommand request, CancellationToken cancellationToken)
    {
        var user = await context.Users
            .FirstOrDefaultAsync(u => u.Id == currentUser.UserId, cancellationToken);

        if (user is null)
            return Result.Failure(Error.NotFound);

        if (!passwordHasher.Verify(request.CurrentPassword, user.PasswordHash))
            return Result.Failure(Error.WrongPassword);

        var newEmail = request.NewEmail.ToLowerInvariant();

        if (user.Email == newEmail)
            return Result.Failure(Error.EmailInUse);

        var emailExists = await context.Users
            .AnyAsync(u => u.Email == newEmail && u.Id != user.Id, cancellationToken);

        if (emailExists)
            return Result.Failure(Error.EmailInUse);

        user.PendingEmail = newEmail;

        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        var tokenHash = Convert.ToBase64String(System.Security.Cryptography.SHA256.HashData(
            System.Text.Encoding.UTF8.GetBytes(token)));

        context.EmailVerificationTokens.Add(new EmailVerificationToken
        {
            UserId = user.Id,
            TokenHash = tokenHash,
            ExpiresAt = DateTime.UtcNow.AddHours(24),
            IsEmailChange = true
        });

        await context.SaveChangesAsync(cancellationToken);

        await emailService.SendEmailVerificationAsync(newEmail, user.Name, token, cancellationToken);

        return Result.Success();
    }
}
