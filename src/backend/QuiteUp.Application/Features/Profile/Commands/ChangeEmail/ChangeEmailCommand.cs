using MediatR;
using QuiteUp.Application.Common.Results;

namespace QuiteUp.Application.Features.Profile.Commands.ChangeEmail;

public record ChangeEmailCommand(string NewEmail, string CurrentPassword) : IRequest<Result>;
