using QuiteUp.Domain.Enums;

namespace QuiteUp.Application.Features.Categories.DTOs;

public record CategoryDto(
    string Id,
    string Name,
    CategoryType Type,
    string Icon,
    string Color,
    bool IsDefault
);
