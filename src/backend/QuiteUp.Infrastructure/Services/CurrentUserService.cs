using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using QuiteUp.Application.Common.Interfaces;

namespace QuiteUp.Infrastructure.Services;

public class CurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUserService
{
    public long? UserId
    {
        get
        {
            var value = httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier)
                        ?? httpContextAccessor.HttpContext?.User?.FindFirstValue("sub");
            return long.TryParse(value, out var id) ? id : null;
        }
    }
}
