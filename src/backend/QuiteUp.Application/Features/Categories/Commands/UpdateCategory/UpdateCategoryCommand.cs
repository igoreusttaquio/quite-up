using MediatR;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Categories.DTOs;

namespace QuiteUp.Application.Features.Categories.Commands.UpdateCategory;

public record UpdateCategoryCommand(long Id, string Name, string Icon, string Color)
    : IRequest<Result<CategoryDto>>;
