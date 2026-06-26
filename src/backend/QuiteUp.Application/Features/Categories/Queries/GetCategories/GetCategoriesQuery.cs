using MediatR;
using QuiteUp.Application.Common.Results;
using QuiteUp.Application.Features.Categories.DTOs;
using QuiteUp.Domain.Enums;

namespace QuiteUp.Application.Features.Categories.Queries.GetCategories;

public record GetCategoriesQuery(CategoryType? Type = null) : IRequest<Result<IReadOnlyList<CategoryDto>>>;
