using MediatR;
using QuiteUp.Application.Common.Results;

namespace QuiteUp.Application.Features.Profile.Commands.ChangePassword;

public record ChangePasswordCommand(string CurrentPassword, string NewPassword, string ConfirmNewPassword)
    : IRequest<Result>;
