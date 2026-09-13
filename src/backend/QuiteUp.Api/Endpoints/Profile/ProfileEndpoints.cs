using NetDevPack.SimpleMediator;
using Microsoft.AspNetCore.Mvc;
using QuiteUp.Api.Common;
using QuiteUp.Application.Features.Profile.Commands.ChangeEmail;
using QuiteUp.Application.Features.Profile.Commands.ChangePassword;
using QuiteUp.Application.Features.Profile.Commands.DeleteProfilePhoto;
using QuiteUp.Application.Features.Profile.Commands.DeleteUserAccount;
using QuiteUp.Application.Features.Profile.Commands.UpdateProfile;
using QuiteUp.Application.Features.Profile.Commands.UploadProfilePhoto;
using QuiteUp.Application.Features.Profile.Queries.GetProfile;
using QuiteUp.Application.Features.Profile.Queries.GetProfilePhoto;

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

        group.MapPost("/photo", async (HttpRequest request, IMediator sender) =>
        {
            if (!request.HasFormContentType)
                return Results.BadRequest(new { message = "Multipart form data required." });

            var form = await request.ReadFormAsync();
            var file = form.Files.GetFile("file");
            if (file is null)
                return Results.BadRequest(new { message = "File is required." });

            if (file.Length > UploadProfilePhotoCommandValidator.MaxFileSizeBytes)
                return Results.BadRequest(new { message = "A imagem deve ter no máximo 5 MB." });

            using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream);

            var result = await sender.Send(new UploadProfilePhotoCommand(
                file.FileName, file.ContentType, file.Length, memoryStream.ToArray()));

            return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
        });

        group.MapGet("/photo", async (IMediator sender) =>
        {
            var result = await sender.Send(new GetProfilePhotoQuery());
            return result.IsSuccess
                ? Results.File(
                    result.Value!.Data,
                    result.Value.ContentType,
                    result.Value.FileName,
                    enableRangeProcessing: true)
                : Results.NotFound(result.Error);
        });

        group.MapDelete("/photo", async (IMediator sender) =>
        {
            var result = await sender.Send(new DeleteProfilePhotoCommand());
            return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
        });
    }

    private record UpdateProfileRequest(string Name);
    private record ChangePasswordRequest(string CurrentPassword, string NewPassword, string ConfirmNewPassword);
    private record ChangeEmailRequest(string NewEmail, string CurrentPassword);
    private record DeleteAccountRequest(string Password);
}
