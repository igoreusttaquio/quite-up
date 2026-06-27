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
        }).AllowAnonymous();

        group.MapPost("/login", async (LoginCommand command, ISender sender, HttpContext ctx, IConfiguration config) =>
        {
            var result = await sender.Send(command);
            if (result.IsFailure)
                return Results.BadRequest(result.Error);

            var expiryDays = int.Parse(config["Jwt:RefreshTokenExpiryDays"] ?? "7");
            SetRefreshTokenCookie(ctx, result.Value!.RefreshToken, expiryDays);
            return Results.Ok(new { result.Value.AccessToken, result.Value.ExpiresAt });
        }).AllowAnonymous();

        group.MapPost("/refresh", async (ISender sender, HttpContext ctx, IConfiguration config) =>
        {
            var refreshToken = ctx.Request.Cookies["refresh_token"];
            if (string.IsNullOrEmpty(refreshToken))
                return Results.Unauthorized();

            var result = await sender.Send(new RefreshTokenCommand(refreshToken));
            if (result.IsFailure)
                return Results.Unauthorized();

            var expiryDays = int.Parse(config["Jwt:RefreshTokenExpiryDays"] ?? "7");
            SetRefreshTokenCookie(ctx, result.Value!.RefreshToken, expiryDays);
            return Results.Ok(new { result.Value.AccessToken, result.Value.ExpiresAt });
        }).AllowAnonymous();

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
        }).AllowAnonymous();

        group.MapPost("/resend-verification", async (ResendVerificationEmailCommand command, ISender sender) =>
        {
            await sender.Send(command);
            return Results.NoContent();
        }).AllowAnonymous();

        group.MapPost("/forgot-password", async (ForgotPasswordCommand command, ISender sender) =>
        {
            await sender.Send(command);
            return Results.NoContent();
        }).AllowAnonymous();

        group.MapPost("/reset-password", async (ResetPasswordCommand command, ISender sender) =>
        {
            var result = await sender.Send(command);
            return result.IsSuccess ? Results.NoContent() : Results.BadRequest(result.Error);
        }).AllowAnonymous();
    }

    private static void SetRefreshTokenCookie(HttpContext ctx, string refreshToken, int expiryDays = 7)
    {
        ctx.Response.Cookies.Append("refresh_token", refreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = ctx.Request.IsHttps,
            SameSite = ctx.Request.IsHttps ? SameSiteMode.Strict : SameSiteMode.Lax,
            Expires = DateTimeOffset.UtcNow.AddDays(expiryDays)
        });
    }
}
