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
        var verificationUrl = $"{configuration["App:Url"]!}/verify-email?token={Uri.EscapeDataString(token)}";

        var content = $"""
            <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;letter-spacing:-0.5px;">
              Confirme seu e-mail
            </h1>
            <p style="margin:0 0 24px;font-size:15px;color:#6B7280;line-height:1.6;">
              Olá, <strong style="color:#111827;">{EscapeHtml(name)}</strong>! Seja bem-vindo(a) ao Quite-Up.
              Estamos muito felizes em ter você por aqui.
            </p>
            <p style="margin:0 0 32px;font-size:15px;color:#374151;line-height:1.7;">
              Para começar a usar a plataforma, confirme seu endereço de e-mail clicando no botão abaixo.
              Isso garante a segurança da sua conta.
            </p>

            {Button(verificationUrl, "Confirmar E-mail")}

            {Divider()}

            <p style="margin:0;font-size:13px;color:#9CA3AF;line-height:1.6;">
              Este link é válido por <strong>24 horas</strong>. Após esse prazo, será necessário solicitar um novo link de verificação.<br><br>
              Se você não criou uma conta no Quite-Up, ignore este e-mail com segurança.
            </p>
            """;

        await SendAsync(
            email, name,
            "Confirme seu e-mail — Quite-Up",
            "Confirme seu e-mail para ativar sua conta no Quite-Up.",
            content,
            cancellationToken);
    }

    public async Task SendPasswordResetAsync(string email, string name, string token, CancellationToken cancellationToken = default)
    {
        var resetUrl = $"{configuration["App:Url"]!}/reset-password?token={Uri.EscapeDataString(token)}";

        var content = $"""
            <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;letter-spacing:-0.5px;">
              Redefinição de senha
            </h1>
            <p style="margin:0 0 24px;font-size:15px;color:#6B7280;line-height:1.6;">
              Olá, <strong style="color:#111827;">{EscapeHtml(name)}</strong>.
            </p>
            <p style="margin:0 0 32px;font-size:15px;color:#374151;line-height:1.7;">
              Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo
              para criar uma nova senha. Se não foi você quem fez essa solicitação, ignore este e-mail
              — sua senha permanece a mesma.
            </p>

            {Button(resetUrl, "Redefinir Senha")}

            {Divider()}

            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="background-color:#FEF3C7;border-left:3px solid #F59E0B;border-radius:0 6px 6px 0;padding:12px 16px;">
                  <p style="margin:0;font-size:13px;color:#92400E;line-height:1.6;">
                    <strong>⚠️ Atenção à segurança:</strong> Este link expira em <strong>1 hora</strong> e pode ser usado apenas uma vez.
                    Nunca compartilhe este link com ninguém.
                  </p>
                </td>
              </tr>
            </table>
            """;

        await SendAsync(
            email, name,
            "Redefinição de senha — Quite-Up",
            "Clique para redefinir a senha da sua conta Quite-Up.",
            content,
            cancellationToken);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private static string Button(string url, string label) => $"""
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="border-radius:10px;background-color:#4F46E5;">
              <a href="{EscapeHtml(url)}"
                 style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;
                        color:#FFFFFF;text-decoration:none;border-radius:10px;letter-spacing:0.1px;">
                {label}
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding-top:16px;">
              <p style="margin:0;font-size:12px;color:#9CA3AF;">
                Ou copie e cole este link no navegador:<br>
                <a href="{EscapeHtml(url)}" style="color:#4F46E5;word-break:break-all;">{EscapeHtml(url)}</a>
              </p>
            </td>
          </tr>
        </table>
        """;

    private static string Divider() =>
        """<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:28px 0;"><tr><td style="border-top:1px solid #E5E7EB;"></td></tr></table>""";

    private static string EscapeHtml(string value) =>
        value.Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;").Replace("\"", "&quot;");

    private static string BuildTemplate(string preheader, string content) => $"""
        <!DOCTYPE html>
        <html lang="pt-BR" xmlns="http://www.w3.org/1999/xhtml">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width,initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <title>Quite-Up</title>
        </head>
        <body style="margin:0;padding:0;background-color:#F3F4F6;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

          <!-- Preheader (preview text in inbox) -->
          <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
            {EscapeHtml(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
          </div>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 style="background-color:#F3F4F6;padding:48px 16px 64px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                       style="max-width:560px;">

                  <!-- Logo -->
                  <tr>
                    <td align="center" style="padding-bottom:28px;">
                      <table role="presentation" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="background-color:#4F46E5;border-radius:10px;width:36px;height:36px;
                                     text-align:center;vertical-align:middle;">
                            <span style="display:block;color:#FFFFFF;font-size:18px;font-weight:800;
                                         line-height:36px;font-family:Arial,sans-serif;">Q</span>
                          </td>
                          <td style="padding-left:9px;vertical-align:middle;">
                            <span style="color:#4F46E5;font-size:19px;font-weight:700;letter-spacing:-0.4px;
                                         font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
                              Quite-Up
                            </span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Card -->
                  <tr>
                    <td style="background-color:#FFFFFF;border-radius:16px;padding:40px 40px 36px;
                               box-shadow:0 1px 4px rgba(0,0,0,0.07),0 4px 16px rgba(0,0,0,0.04);
                               font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
                      {content}
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td align="center" style="padding-top:28px;">
                      <p style="margin:0 0 8px;font-size:12px;color:#9CA3AF;text-align:center;
                                font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
                        © {DateTime.UtcNow.Year} Quite-Up · Finanças pessoais
                      </p>
                      <p style="margin:0;font-size:12px;color:#D1D5DB;text-align:center;
                                font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
                        Você está recebendo este e-mail porque uma ação foi realizada na sua conta.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>

        </body>
        </html>
        """;

    private async Task SendAsync(
        string toEmail, string toName,
        string subject, string preheader,
        string htmlContent,
        CancellationToken cancellationToken)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(configuration["Smtp:FromName"]!, configuration["Smtp:FromEmail"]!));
        message.To.Add(new MailboxAddress(toName, toEmail));
        message.Subject = subject;
        message.Body = new BodyBuilder { HtmlBody = BuildTemplate(preheader, htmlContent) }.ToMessageBody();

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
