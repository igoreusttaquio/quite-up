namespace QuiteUp.Application.Common.Interfaces;

public interface IEmailService
{
    Task SendEmailVerificationAsync(string email, string name, string token, CancellationToken cancellationToken = default);
    Task SendPasswordResetAsync(string email, string name, string token, CancellationToken cancellationToken = default);
}
