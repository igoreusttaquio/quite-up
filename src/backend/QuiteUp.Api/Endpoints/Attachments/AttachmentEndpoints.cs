using NetDevPack.SimpleMediator;
using QuiteUp.Api.Common;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Features.Attachments.Commands.DeleteAttachment;
using QuiteUp.Application.Features.Attachments.Commands.UploadAttachment;
using QuiteUp.Application.Features.Attachments.Queries.GetAttachment;

namespace QuiteUp.Api.Endpoints.Attachments;

public class AttachmentEndpoints : IEndpoint
{
    public void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/attachments")
            .WithTags("Attachments")
            .RequireAuthorization();

        group.MapGet("/{externalId}", async (string externalId, IMediator sender, IIdEncoder encoder) =>
        {
            var id = encoder.Decode(externalId);
            if (id is null) return Results.NotFound();

            var result = await sender.Send(new GetAttachmentQuery(id.Value));
            if (result.IsFailure)
                return Results.NotFound(result.Error);

            var attachment = result.Value!;
            return Results.File(
                attachment.Data,
                attachment.ContentType,
                attachment.FileName,
                enableRangeProcessing: true);
        });

        group.MapDelete("/{externalId}", async (string externalId, IMediator sender, IIdEncoder encoder) =>
        {
            var id = encoder.Decode(externalId);
            if (id is null) return Results.NotFound();

            var result = await sender.Send(new DeleteAttachmentCommand(id.Value));
            return result.IsSuccess ? Results.NoContent() : Results.NotFound(result.Error);
        });
    }
}
