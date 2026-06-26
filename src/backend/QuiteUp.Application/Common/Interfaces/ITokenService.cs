namespace QuiteUp.Application.Common.Interfaces;

public interface ITokenService
{
    string GenerateAccessToken(long userId, string email, string name);
    (string token, string tokenHash) GenerateRefreshToken();
    (string token, string tokenHash) GenerateSecureToken();
}
