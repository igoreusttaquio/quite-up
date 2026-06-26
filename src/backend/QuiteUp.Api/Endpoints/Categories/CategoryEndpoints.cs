using MediatR;
using QuiteUp.Api.Common;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Features.Categories.Commands.CreateCategory;
using QuiteUp.Application.Features.Categories.Commands.DeleteCategory;
using QuiteUp.Application.Features.Categories.Commands.UpdateCategory;
using QuiteUp.Application.Features.Categories.Queries.GetCategories;
using QuiteUp.Domain.Enums;

namespace QuiteUp.Api.Endpoints.Categories;

public class CategoryEndpoints : IEndpoint
{
    public void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/categories")
            .WithTags("Categories")
            .RequireAuthorization();

        group.MapGet("/", async (ISender sender, CategoryType? type = null) =>
        {
            var result = await sender.Send(new GetCategoriesQuery(type));
            return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
        });

        group.MapPost("/", async (CreateCategoryRequest req, ISender sender) =>
        {
            var result = await sender.Send(new CreateCategoryCommand(req.Name, req.Type, req.Icon, req.Color));
            return result.IsSuccess
                ? Results.Created($"/api/categories/{result.Value!.Id}", result.Value)
                : Results.BadRequest(result.Error);
        });

        group.MapPut("/{externalId}", async (string externalId, UpdateCategoryRequest req, ISender sender, IIdEncoder encoder) =>
        {
            var id = encoder.Decode(externalId);
            if (id is null) return Results.NotFound();

            var result = await sender.Send(new UpdateCategoryCommand(id.Value, req.Name, req.Icon, req.Color));
            return result.IsSuccess ? Results.Ok(result.Value) : Results.NotFound(result.Error);
        });

        group.MapDelete("/{externalId}", async (string externalId, ISender sender, IIdEncoder encoder) =>
        {
            var id = encoder.Decode(externalId);
            if (id is null) return Results.NotFound();

            var result = await sender.Send(new DeleteCategoryCommand(id.Value));
            return result.IsSuccess ? Results.NoContent() : Results.Problem(result.Error!.Message, statusCode: StatusCodes.Status409Conflict);
        });
    }

    private record CreateCategoryRequest(string Name, CategoryType Type, string Icon, string Color);
    private record UpdateCategoryRequest(string Name, string Icon, string Color);
}
