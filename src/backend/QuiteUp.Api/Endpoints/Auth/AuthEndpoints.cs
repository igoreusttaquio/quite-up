using MediatR;
using QuiteUp.Api.Common;
using QuiteUp.Application.Features.Auth.Commands.ForgotPassword;
using QuiteUp.Application.Features.Auth.Commands.Login;
using QuiteUp.Application.Features.Auth.Commands.Logout;
using QuiteUp.Application.Features.Auth.Commands.RefreshToken;
using QuiteUp.Application.Features.Auth.Commands.Register;
using QuiteUp.Application.Features.Auth.Commands.ResendVerification;
using QuiteUp.Application.Features.Auth.Commands.ResetPassword;
using QuiteUp.Application.Features.Auth.Commands.VerifyEmail;

namespace QuiteUp.Api.Endpoints.Auth;

public class AuthEndpoints : IEndpoint
{
    public void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth").WithTags("Auth");

        group.MapPost("/register", async (RegisterUserCommand command, ISender sender) =>
        {
            var result = await sender.Send(command);
            return result.IsSuccess
                ? Results.Created(string.Empty, result.Value)
                : Results.BadRequest(result.Error);
        });

        group.MapPost("/login", async (LoginCommand command, ISender sender, HttpContext ctx) =>
        {
            var result = await sender.Send(command);
            if (result.IsFailure)
                return Results.BadRequest(result.Error);

            SetRefreshTokenCookie(ctx, result.Value!.RefreshToken);
            return Results.Ok(new { result.Value.AccessToken, result.Value.ExpiresAt });
        });

        group.MapPost("/refresh", async (ISender sender, HttpContext ctx) =>
        {
            var refreshToken = ctx.Request.Cookies["refresh_token"];
            if (string.IsNullOrEmpty(refreshToken))
                return Results.Unauthorized();

            var result = await sender.Send(new RefreshTokenCommand(refreshToken));
            if (result.IsFailure)
                return Results.Unauthorized();

            SetRefreshTokenCookie(ctx, result.Value!.RefreshToken);
            return Results.Ok(new { result.Value.AccessToken, result.Value.ExpiresAt });
        });

        group.MapPost("/logout", async (ISender sender, HttpContext ctx) =>
        {
            var refreshToken = ctx.Request.Cookies["refresh_token"];
            if (!string.IsNullOrEmpty(refreshToken))
                await sender.Send(new LogoutCommand(refreshToken));

            ctx.Response.Cookies.Delete("refresh_token");
            return Results.NoContent();
        }).RequireAuthorization();

        group.MapPost("/verify-email", async (VerifyEmailCommand command, ISender sender) =>
        {
            var result = await sender.Send(command);
            return result.IsSuccess ? Results.NoContent() : Results.BadRequest(result.Error);
        });

        group.MapPost("/resend-verification", async (ResendVerificationEmailCommand command, ISender sender) =>
        {
            await sender.Send(command);
            return Results.NoContent();
        });

        group.MapPost("/forgot-password", async (ForgotPasswordCommand command, ISender sender) =>
        {
            await sender.Send(command);
            return Results.NoContent();
        });

        group.MapPost("/reset-password", async (ResetPasswordCommand command, ISender sender) =>
        {
            var result = await sender.Send(command);
            return result.IsSuccess ? Results.NoContent() : Results.BadRequest(result.Error);
        });
    }

    private static void SetRefreshTokenCookie(HttpContext ctx, string refreshToken)
    {
        ctx.Response.Cookies.Append("refresh_token", refreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = DateTimeOffset.UtcNow.AddDays(7)
        });
    }
}
