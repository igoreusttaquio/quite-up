using MediatR;
using QuiteUp.Api.Common;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Features.Budgets.Commands.CreateBudget;
using QuiteUp.Application.Features.Budgets.Commands.DeleteBudget;
using QuiteUp.Application.Features.Budgets.Commands.UpdateBudget;
using QuiteUp.Application.Features.Budgets.Queries.GetBudgets;

namespace QuiteUp.Api.Endpoints.Budgets;

public class BudgetEndpoints : IEndpoint
{
    public void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/budgets")
            .WithTags("Budgets")
            .RequireAuthorization();

        group.MapGet("/", async (
            int? month,
            int? year,
            ISender sender) =>
        {
            var result = await sender.Send(new GetBudgetsQuery(month, year));
            return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
        });

        group.MapPost("/", async (
            CreateBudgetRequest req,
            ISender sender,
            IIdEncoder encoder) =>
        {
            var categoryId = encoder.Decode(req.CategoryId);
            if (categoryId is null) return Results.BadRequest(new { message = "Categoria inválida." });

            var result = await sender.Send(new CreateBudgetCommand(
                categoryId.Value, req.Amount, req.Month, req.Year));

            return result.IsSuccess
                ? Results.Created($"/api/budgets/{result.Value!.Id}", result.Value)
                : Results.BadRequest(result.Error);
        });

        group.MapPut("/{externalId}", async (
            string externalId,
            UpdateBudgetRequest req,
            ISender sender,
            IIdEncoder encoder) =>
        {
            var id = encoder.Decode(externalId);
            if (id is null) return Results.NotFound();

            var categoryId = encoder.Decode(req.CategoryId);
            if (categoryId is null) return Results.BadRequest(new { message = "Categoria inválida." });

            var result = await sender.Send(new UpdateBudgetCommand(
                id.Value, categoryId.Value, req.Amount, req.Month, req.Year));

            return result.IsSuccess ? Results.Ok(result.Value) : Results.NotFound(result.Error);
        });

        group.MapDelete("/{externalId}", async (string externalId, ISender sender, IIdEncoder encoder) =>
        {
            var id = encoder.Decode(externalId);
            if (id is null) return Results.NotFound();

            var result = await sender.Send(new DeleteBudgetCommand(id.Value));
            return result.IsSuccess ? Results.NoContent() : Results.NotFound(result.Error);
        });
    }

    private record CreateBudgetRequest(
        string CategoryId,
        decimal Amount,
        int Month,
        int Year);

    private record UpdateBudgetRequest(
        string CategoryId,
        decimal Amount,
        int Month,
        int Year);
}
