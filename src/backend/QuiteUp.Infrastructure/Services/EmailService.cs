using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using MimeKit;
using QuiteUp.Application.Common.Interfaces;

namespace QuiteUp.Infrastructure.Services;

public class EmailService(IConfiguration configuration) : IEmailService
{
    public async Task SendEmailVerificationAsync(string email, string name, string token, CancellationToken cancellationToken = default)
    {
        var appUrl = configuration["App:Url"]!;
        var verificationUrl = $"{appUrl}/verify-email?token={Uri.EscapeDataString(token)}";

        var body = $"""
            <h2>Bem-vindo ao Quite-Up, {name}!</h2>
            <p>Clique no link abaixo para verificar seu email:</p>
            <p><a href="{verificationUrl}">Verificar email</a></p>
            <p>Este link expira em 24 horas.</p>
            """;

        await SendAsync(email, name, "Verifique seu email — Quite-Up", body, cancellationToken);
    }

    public async Task SendPasswordResetAsync(string email, string name, string token, CancellationToken cancellationToken = default)
    {
        var appUrl = configuration["App:Url"]!;
        var resetUrl = $"{appUrl}/reset-password?token={Uri.EscapeDataString(token)}";

        var body = $"""
            <h2>Redefinição de senha — Quite-Up</h2>
            <p>Olá, {name}. Clique no link abaixo para redefinir sua senha:</p>
            <p><a href="{resetUrl}">Redefinir senha</a></p>
            <p>Este link expira em 1 hora. Se você não solicitou isso, ignore este email.</p>
            """;

        await SendAsync(email, name, "Redefinição de senha — Quite-Up", body, cancellationToken);
    }

    private async Task SendAsync(string toEmail, string toName, string subject, string htmlBody, CancellationToken cancellationToken)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(configuration["Smtp:FromName"]!, configuration["Smtp:FromEmail"]!));
        message.To.Add(new MailboxAddress(toName, toEmail));
        message.Subject = subject;
        message.Body = new BodyBuilder { HtmlBody = htmlBody }.ToMessageBody();

        using var client = new SmtpClient();
        await client.ConnectAsync(
            configuration["Smtp:Host"]!,
            int.Parse(configuration["Smtp:Port"]!),
            SecureSocketOptions.StartTls,
            cancellationToken);
        await client.AuthenticateAsync(configuration["Smtp:User"]!, configuration["Smtp:Password"]!, cancellationToken);
        await client.SendAsync(message, cancellationToken);
        await client.DisconnectAsync(true, cancellationToken);
    }
}
