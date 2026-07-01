using NetDevPack.SimpleMediator;
using QuiteUp.Api.Common;
using QuiteUp.Application.Common.Interfaces;
using QuiteUp.Application.Features.Accounts.Commands.CreateAccount;
using QuiteUp.Application.Features.Accounts.Commands.DeactivateAccount;
using QuiteUp.Application.Features.Accounts.Commands.UpdateAccount;
using QuiteUp.Application.Features.Accounts.Queries.GetAccountById;
using QuiteUp.Application.Features.Accounts.Queries.GetAccounts;
using QuiteUp.Domain.Enums;

namespace QuiteUp.Api.Endpoints.Accounts;

public class AccountEndpoints : IEndpoint
{
    public void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/accounts")
            .WithTags("Accounts")
            .RequireAuthorization();

        group.MapGet("/", async (IMediator sender, bool includeInactive = false) =>
        {
            var result = await sender.Send(new GetAccountsQuery(includeInactive));
            return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
        });

        group.MapGet("/{externalId}", async (string externalId, IMediator sender, IIdEncoder encoder) =>
        {
            var id = encoder.Decode(externalId);
            if (id is null) return Results.NotFound();

            var result = await sender.Send(new GetAccountByIdQuery(id.Value));
            return result.IsSuccess ? Results.Ok(result.Value) : Results.NotFound(result.Error);
        });

        group.MapPost("/", async (CreateAccountRequest req, IMediator sender) =>
        {
            var result = await sender.Send(new CreateAccountCommand(req.Name, req.Type, req.InitialBalance));
            return result.IsSuccess
                ? Results.Created($"/api/accounts/{result.Value!.Id}", result.Value)
                : Results.BadRequest(result.Error);
        });

        group.MapPut("/{externalId}", async (string externalId, UpdateAccountRequest req, IMediator sender, IIdEncoder encoder) =>
        {
            var id = encoder.Decode(externalId);
            if (id is null) return Results.NotFound();

            var result = await sender.Send(new UpdateAccountCommand(id.Value, req.Name, req.Type));
            return result.IsSuccess ? Results.Ok(result.Value) : Results.NotFound(result.Error);
        });

        group.MapPut("/{externalId}/deactivate", async (string externalId, IMediator sender, IIdEncoder encoder) =>
        {
            var id = encoder.Decode(externalId);
            if (id is null) return Results.NotFound();

            var result = await sender.Send(new DeactivateAccountCommand(id.Value));
            return result.IsSuccess ? Results.NoContent() : Results.NotFound(result.Error);
        });
    }

    private record CreateAccountRequest(string Name, AccountType Type, decimal InitialBalance);
    private record UpdateAccountRequest(string Name, AccountType Type);
}
