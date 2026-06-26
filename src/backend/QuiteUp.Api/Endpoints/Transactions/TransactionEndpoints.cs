using MediatR;
using QuiteUp.Api.Common;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Features.Transactions.Commands.CreateTransaction;
using QuiteUp.Application.Features.Transactions.Commands.DeleteTransaction;
using QuiteUp.Application.Features.Transactions.Commands.UpdateTransaction;
using QuiteUp.Application.Features.Transactions.Queries.GetTransactions;
using QuiteUp.Domain.Enums;

namespace QuiteUp.Api.Endpoints.Transactions;

public class TransactionEndpoints : IEndpoint
{
    public void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/transactions")
            .WithTags("Transactions")
            .RequireAuthorization();

        group.MapGet("/", async (
            ISender sender,
            IIdEncoder encoder,
            string? accountId = null,
            TransactionType? type = null,
            string? categoryId = null,
            string? startDate = null,
            string? endDate = null,
            int page = 1,
            int pageSize = 20) =>
        {
            long? decodedAccountId = accountId is not null ? encoder.Decode(accountId) : null;
            long? decodedCategoryId = categoryId is not null ? encoder.Decode(categoryId) : null;
            DateOnly? parsedStart = startDate is not null && DateOnly.TryParse(startDate, out var s) ? s : null;
            DateOnly? parsedEnd = endDate is not null && DateOnly.TryParse(endDate, out var e) ? e : null;

            var result = await sender.Send(new GetTransactionsQuery(
                decodedAccountId, type, decodedCategoryId, parsedStart, parsedEnd, page, pageSize));

            return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
        });

        group.MapPost("/", async (CreateTransactionRequest req, ISender sender, IIdEncoder encoder) =>
        {
            var accountId = encoder.Decode(req.AccountId);
            if (accountId is null) return Results.BadRequest(new { message = "Conta inválida." });

            long? destId = req.DestinationAccountId is not null ? encoder.Decode(req.DestinationAccountId) : null;
            long? catId = req.CategoryId is not null ? encoder.Decode(req.CategoryId) : null;

            var result = await sender.Send(new CreateTransactionCommand(
                req.Type, req.Amount, req.Date, accountId.Value, catId, destId, req.Description));

            return result.IsSuccess
                ? Results.Created($"/api/transactions/{result.Value!.Id}", result.Value)
                : Results.BadRequest(result.Error);
        });

        group.MapPut("/{externalId}", async (
            string externalId,
            UpdateTransactionRequest req,
            ISender sender,
            IIdEncoder encoder) =>
        {
            var id = encoder.Decode(externalId);
            if (id is null) return Results.NotFound();

            long? catId = req.CategoryId is not null ? encoder.Decode(req.CategoryId) : null;

            var result = await sender.Send(new UpdateTransactionCommand(
                id.Value, req.Amount, req.Date, catId, req.Description));

            return result.IsSuccess ? Results.Ok(result.Value) : Results.NotFound(result.Error);
        });

        group.MapDelete("/{externalId}", async (string externalId, ISender sender, IIdEncoder encoder) =>
        {
            var id = encoder.Decode(externalId);
            if (id is null) return Results.NotFound();

            var result = await sender.Send(new DeleteTransactionCommand(id.Value));
            return result.IsSuccess ? Results.NoContent() : Results.NotFound(result.Error);
        });
    }

    private record CreateTransactionRequest(
        TransactionType Type,
        decimal Amount,
        DateOnly Date,
        string AccountId,
        string? CategoryId,
        string? DestinationAccountId,
        string? Description);

    private record UpdateTransactionRequest(
        decimal Amount,
        DateOnly Date,
        string? CategoryId,
        string? Description);
}
