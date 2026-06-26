namespace QuiteUp.Application.Common.Results;

public record Error(string Code, string Message)
{
    public static readonly Error None = new(string.Empty, string.Empty);
    public static readonly Error InvalidCredentials = new("Auth.InvalidCredentials", "Email ou senha inválidos.");
    public static readonly Error AccountNotActive = new("Auth.AccountNotActive", "Conta não ativada. Verifique seu email.");
    public static readonly Error AccountLocked = new("Auth.AccountLocked", "Conta bloqueada temporariamente. Tente novamente em 15 minutos.");
    public static readonly Error EmailAlreadyExists = new("Auth.EmailAlreadyExists", "Email ou senha inválidos.");
    public static readonly Error InvalidToken = new("Auth.InvalidToken", "Token inválido ou expirado.");
}
