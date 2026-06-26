using QuiteUp.Domain.Enums;

namespace QuiteUp.Application.Features.Accounts.DTOs;

public record AccountDto(
    string Id,
    string Name,
    AccountType Type,
    decimal InitialBalance,
    decimal CurrentBalance,
    bool IsActive,
    DateTime CreatedAt
);
