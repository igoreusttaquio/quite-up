using NetDevPack.SimpleMediator;
using Microsoft.AspNetCore.Mvc;
using QuiteUp.Api.Common;
using QuiteUp.Application.Features.Profile.Commands.ChangeEmail;
using QuiteUp.Application.Features.Profile.Commands.ChangePassword;
using QuiteUp.Application.Features.Profile.Commands.DeleteUserAccount;
using QuiteUp.Application.Features.Profile.Commands.UpdateProfile;
using QuiteUp.Application.Features.Profile.Queries.GetProfile;

namespace QuiteUp.Api.Endpoints.Profile;

public class ProfileEndpoints : IEndpoint
{
    public void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/profile")
            .WithTags("Profile")
            .RequireAuthorization();

        group.MapGet("/", async (IMediator sender) =>
        {
            var result = await sender.Send(new GetProfileQuery());
            return result.IsSuccess ? Results.Ok(result.Value) : Results.NotFound(result.Error);
        });

        group.MapPut("/", async (UpdateProfileRequest req, IMediator sender) =>
        {
            var result = await sender.Send(new UpdateProfileCommand(req.Name));
            return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
        });

        group.MapPost("/change-password", async (ChangePasswordRequest req, IMediator sender) =>
        {
            var result = await sender.Send(
                new ChangePasswordCommand(req.CurrentPassword, req.NewPassword, req.ConfirmNewPassword));
            return result.IsSuccess ? Results.NoContent() : Results.BadRequest(result.Error);
        });

        group.MapPost("/change-email", async (ChangeEmailRequest req, IMediator sender) =>
        {
            var result = await sender.Send(new ChangeEmailCommand(req.NewEmail, req.CurrentPassword));
            return result.IsSuccess ? Results.NoContent() : Results.BadRequest(result.Error);
        });

        group.MapDelete("/", async ([FromBody] DeleteAccountRequest req, IMediator sender) =>
        {
            var result = await sender.Send(new DeleteUserAccountCommand(req.Password));
            return result.IsSuccess ? Results.NoContent() : Results.BadRequest(result.Error);
        });
    }

    private record UpdateProfileRequest(string Name);
    private record ChangePasswordRequest(string CurrentPassword, string NewPassword, string ConfirmNewPassword);
    private record ChangeEmailRequest(string NewEmail, string CurrentPassword);
    private record DeleteAccountRequest(string Password);
}
