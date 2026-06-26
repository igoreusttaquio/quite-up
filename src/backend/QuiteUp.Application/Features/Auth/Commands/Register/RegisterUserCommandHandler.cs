using MediatR;
using Microsoft.EntityFrameworkCore;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Auth.DTOs;
using QuiteUp.Domain.Entities;
using QuiteUp.Domain.Enums;

namespace QuiteUp.Application.Features.Auth.Commands.Register;

public class RegisterUserCommandHandler(
    IApplicationDbContext context,
    IPasswordHasher passwordHasher,
    IEmailService emailService,
    ITokenService tokenService) : IRequestHandler<RegisterUserCommand, Result<UserDto>>
{
    public async Task<Result<UserDto>> Handle(RegisterUserCommand request, CancellationToken cancellationToken)
    {
        var emailExists = await context.Users
            .AnyAsync(u => u.Email == request.Email.ToLowerInvariant(), cancellationToken);

        if (emailExists)
            return Result<UserDto>.Failure(Error.EmailAlreadyExists);

        var user = new User
        {
            Name = request.Name.Trim(),
            Email = request.Email.ToLowerInvariant().Trim(),
            Status = UserStatus.Inactive
        };

        user.PasswordHash = passwordHasher.Hash(request.Password);
        context.Users.Add(user);

        var (token, tokenHash) = tokenService.GenerateSecureToken();
        context.EmailVerificationTokens.Add(new EmailVerificationToken
        {
            User = user,
            TokenHash = tokenHash,
            ExpiresAt = DateTime.UtcNow.AddHours(24)
        });

        await context.SaveChangesAsync(cancellationToken);
        await emailService.SendEmailVerificationAsync(user.Email, user.Name, token, cancellationToken);

        return Result<UserDto>.Success(new UserDto(user.Id, user.Name, user.Email, user.Status, user.CreatedAt));
    }
}
