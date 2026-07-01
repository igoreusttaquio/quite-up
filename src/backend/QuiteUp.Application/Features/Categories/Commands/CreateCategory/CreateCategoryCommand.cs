using NetDevPack.SimpleMediator;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Categories.DTOs;
using QuiteUp.Domain.Enums;

namespace QuiteUp.Application.Features.Categories.Commands.CreateCategory;

public record CreateCategoryCommand(string Name, CategoryType Type, string Icon, string Color)
    : IRequest<Result<CategoryDto>>;
