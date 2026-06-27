namespace QuiteUp.Application.Common.Interfaces;

public interface ITokenService
{
    int AccessTokenExpiryMinutes { get; }
    int RefreshTokenExpiryDays { get; }
    string GenerateAccessToken(long userId, string email, string name);
    (string token, string tokenHash) GenerateRefreshToken();
    (string token, string tokenHash) GenerateSecureToken();
}
