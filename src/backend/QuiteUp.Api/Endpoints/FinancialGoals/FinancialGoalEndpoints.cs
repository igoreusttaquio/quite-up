using MediatR;
using QuiteUp.Api.Common;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Features.FinancialGoals.Commands.AddGoalContribution;
using QuiteUp.Application.Features.FinancialGoals.Commands.CreateFinancialGoal;
using QuiteUp.Application.Features.FinancialGoals.Commands.DeleteFinancialGoal;
using QuiteUp.Application.Features.FinancialGoals.Commands.UpdateFinancialGoal;
using QuiteUp.Application.Features.FinancialGoals.Queries.GetFinancialGoalById;
using QuiteUp.Application.Features.FinancialGoals.Queries.GetFinancialGoals;
using QuiteUp.Application.Features.FinancialGoals.Queries.GetGoalContributions;

namespace QuiteUp.Api.Endpoints.FinancialGoals;

public class FinancialGoalEndpoints : IEndpoint
{
    public void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/financial-goals")
            .WithTags("Financial Goals")
            .RequireAuthorization();

        group.MapGet("/", async (bool? isCompleted, ISender sender) =>
        {
            var result = await sender.Send(new GetFinancialGoalsQuery(isCompleted));
            return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
        });

        group.MapGet("/{externalId}", async (string externalId, ISender sender, IIdEncoder encoder) =>
        {
            var id = encoder.Decode(externalId);
            if (id is null) return Results.NotFound();

            var result = await sender.Send(new GetFinancialGoalByIdQuery(id.Value));
            return result.IsSuccess ? Results.Ok(result.Value) : Results.NotFound(result.Error);
        });

        group.MapPost("/", async (
            CreateFinancialGoalRequest req,
            ISender sender) =>
        {
            var result = await sender.Send(new CreateFinancialGoalCommand(
                req.Name, req.TargetAmount, req.TargetDate));

            return result.IsSuccess
                ? Results.Created($"/api/financial-goals/{result.Value!.Id}", result.Value)
                : Results.BadRequest(result.Error);
        });

        group.MapPut("/{externalId}", async (
            string externalId,
            UpdateFinancialGoalRequest req,
            ISender sender,
            IIdEncoder encoder) =>
        {
            var id = encoder.Decode(externalId);
            if (id is null) return Results.NotFound();

            var result = await sender.Send(new UpdateFinancialGoalCommand(
                id.Value, req.Name, req.TargetAmount, req.TargetDate));

            return result.IsSuccess ? Results.Ok(result.Value) : Results.NotFound(result.Error);
        });

        group.MapDelete("/{externalId}", async (string externalId, ISender sender, IIdEncoder encoder) =>
        {
            var id = encoder.Decode(externalId);
            if (id is null) return Results.NotFound();

            var result = await sender.Send(new DeleteFinancialGoalCommand(id.Value));
            return result.IsSuccess ? Results.NoContent() : Results.NotFound(result.Error);
        });

        group.MapGet("/{externalId}/contributions", async (
            string externalId,
            ISender sender,
            IIdEncoder encoder) =>
        {
            var id = encoder.Decode(externalId);
            if (id is null) return Results.NotFound();

            var result = await sender.Send(new GetGoalContributionsQuery(id.Value));
            return result.IsSuccess ? Results.Ok(result.Value) : Results.NotFound(result.Error);
        });

        group.MapPost("/{externalId}/contributions", async (
            string externalId,
            AddGoalContributionRequest req,
            ISender sender,
            IIdEncoder encoder) =>
        {
            var id = encoder.Decode(externalId);
            if (id is null) return Results.NotFound();

            var result = await sender.Send(new AddGoalContributionCommand(
                id.Value, req.Amount, req.Date, req.Notes));

            return result.IsSuccess
                ? Results.Created($"/api/financial-goals/{externalId}/contributions/{result.Value!.Id}", result.Value)
                : Results.BadRequest(result.Error);
        });
    }

    private record CreateFinancialGoalRequest(
        string Name,
        decimal TargetAmount,
        DateOnly? TargetDate);

    private record UpdateFinancialGoalRequest(
        string Name,
        decimal TargetAmount,
        DateOnly? TargetDate);

    private record AddGoalContributionRequest(
        decimal Amount,
        DateOnly Date,
        string? Notes);
}
