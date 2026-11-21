using NetDevPack.SimpleMediator;
using QuiteUp.Api.Common;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Features.Debts.Commands.CreateDebt;
using QuiteUp.Application.Features.Debts.Commands.DeleteDebt;
using QuiteUp.Application.Features.Debts.Commands.DeleteDebtPayment;
using QuiteUp.Application.Features.Debts.Commands.UpdateDebtPayment;
using QuiteUp.Application.Features.Debts.Commands.RegisterDebtPayment;
using QuiteUp.Application.Features.Debts.Commands.UpdateDebt;
using QuiteUp.Application.Features.Debts;
using QuiteUp.Application.Features.Debts.Queries.GetDebtById;
using QuiteUp.Application.Features.Debts.Queries.GetDebtInstallments;
using QuiteUp.Application.Features.Debts.Queries.GetDebtPayments;
using QuiteUp.Application.Features.Debts.Queries.GetDebts;
using QuiteUp.Application.Features.Debts.Queries.GetSnowballStrategy;
using QuiteUp.Domain.Enums;

namespace QuiteUp.Api.Endpoints.Debts;

public class DebtEndpoints : IEndpoint
{
    public void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/debts")
            .WithTags("Debts")
            .RequireAuthorization();

        group.MapGet("/", async (IMediator sender, bool? isPaid = null) =>
        {
            var result = await sender.Send(new GetDebtsQuery(isPaid));
            return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
        });

        group.MapGet("/snowball", async (IMediator sender) =>
        {
            var result = await sender.Send(new GetSnowballStrategyQuery());
            return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
        });

        group.MapGet("/{externalId}", async (string externalId, IMediator sender, IIdEncoder encoder) =>
        {
            var id = encoder.Decode(externalId);
            if (id is null) return Results.NotFound();

            var result = await sender.Send(new GetDebtByIdQuery(id.Value));
            return result.IsSuccess ? Results.Ok(result.Value) : Results.NotFound(result.Error);
        });

        group.MapPost("/", async (DebtInput req, IMediator sender) =>
        {
            var result = await sender.Send(new CreateDebtCommand(req));

            return result.IsSuccess
                ? Results.Created($"/api/debts/{result.Value!.Id}", result.Value)
                : Results.BadRequest(result.Error);
        });

        group.MapPut("/{externalId}", async (string externalId, DebtInput req, IMediator sender, IIdEncoder encoder) =>
        {
            var id = encoder.Decode(externalId);
            if (id is null) return Results.NotFound();

            var result = await sender.Send(new UpdateDebtCommand(id.Value, req));

            return result.IsSuccess ? Results.Ok(result.Value) : Results.NotFound(result.Error);
        });

        group.MapDelete("/{externalId}", async (string externalId, IMediator sender, IIdEncoder encoder) =>
        {
            var id = encoder.Decode(externalId);
            if (id is null) return Results.NotFound();

            var result = await sender.Send(new DeleteDebtCommand(id.Value));
            return result.IsSuccess ? Results.NoContent() : Results.NotFound(result.Error);
        });

        group.MapGet("/{externalId}/installments", async (string externalId, IMediator sender, IIdEncoder encoder) =>
        {
            var id = encoder.Decode(externalId);
            if (id is null) return Results.NotFound();

            var result = await sender.Send(new GetDebtInstallmentsQuery(id.Value));
            return result.IsSuccess ? Results.Ok(result.Value) : Results.NotFound(result.Error);
        });

        group.MapGet("/{externalId}/payments", async (string externalId, IMediator sender, IIdEncoder encoder) =>
        {
            var id = encoder.Decode(externalId);
            if (id is null) return Results.NotFound();

            var result = await sender.Send(new GetDebtPaymentsQuery(id.Value));
            return result.IsSuccess ? Results.Ok(result.Value) : Results.NotFound(result.Error);
        });

        group.MapPost("/{externalId}/payments", async (string externalId, RegisterPaymentRequest req, IMediator sender, IIdEncoder encoder) =>
        {
            var id = encoder.Decode(externalId);
            if (id is null) return Results.NotFound();

            long? accountId = req.AccountId is not null ? encoder.Decode(req.AccountId) : null;

            var result = await sender.Send(new RegisterDebtPaymentCommand(
                id.Value, req.Amount, req.PaymentDate, req.IsEarlyPayment, req.Discount, req.Notes, accountId));

            return result.IsSuccess
                ? Results.Created($"/api/debts/{externalId}/payments/{result.Value!.Id}", result.Value)
                : Results.BadRequest(result.Error);
        });

        group.MapPut("/{externalId}/payments/{paymentExternalId}", async (
            string externalId,
            string paymentExternalId,
            UpdatePaymentRequest req,
            IMediator sender,
            IIdEncoder encoder) =>
        {
            var id = encoder.Decode(externalId);
            var paymentId = encoder.Decode(paymentExternalId);
            if (id is null || paymentId is null) return Results.NotFound();

            long? accountId = req.AccountId is not null ? encoder.Decode(req.AccountId) : null;

            var result = await sender.Send(new UpdateDebtPaymentCommand(
                id.Value, paymentId.Value, req.Amount, req.PaymentDate, req.IsEarlyPayment, req.Discount, req.Notes, accountId));

            return result.IsSuccess ? Results.Ok(result.Value) : Results.NotFound(result.Error);
        });

        group.MapDelete("/{externalId}/payments/{paymentExternalId}", async (
            string externalId,
            string paymentExternalId,
            IMediator sender,
            IIdEncoder encoder) =>
        {
            var id = encoder.Decode(externalId);
            var paymentId = encoder.Decode(paymentExternalId);
            if (id is null || paymentId is null) return Results.NotFound();

            var result = await sender.Send(new DeleteDebtPaymentCommand(id.Value, paymentId.Value));
            return result.IsSuccess ? Results.NoContent() : Results.NotFound(result.Error);
        });
    }

    private record UpdatePaymentRequest(
        decimal Amount,
        DateOnly PaymentDate,
        bool IsEarlyPayment,
        decimal Discount,
        string? Notes,
        string? AccountId = null);

    private record RegisterPaymentRequest(
        decimal Amount,
        DateOnly PaymentDate,
        bool IsEarlyPayment,
        decimal Discount,
        string? Notes,
        string? AccountId = null);
}
