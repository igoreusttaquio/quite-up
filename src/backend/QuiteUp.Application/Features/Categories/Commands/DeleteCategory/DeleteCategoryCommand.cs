using MediatR;
using QuiteUp.Application.Common.Results;

namespace QuiteUp.Application.Features.Categories.Commands.DeleteCategory;

public record DeleteCategoryCommand(long Id) : IRequest<Result>;
