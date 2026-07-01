namespace QuiteUp.Application.Common.Results;

public record Error(string Code, string Message)
{
    public static readonly Error None = new(string.Empty, string.Empty);
    public static readonly Error InvalidCredentials = new("Auth.InvalidCredentials", "Email ou senha inválidos.");
    public static readonly Error AccountNotActive = new("Auth.AccountNotActive", "Conta não ativada. Verifique seu email.");
    public static readonly Error AccountLocked = new("Auth.AccountLocked", "Conta bloqueada temporariamente. Tente novamente em 15 minutos.");
    public static readonly Error EmailAlreadyExists = new("Auth.EmailAlreadyExists", "Email ou senha inválidos.");
    public static readonly Error InvalidToken = new("Auth.InvalidToken", "Token inválido ou expirado.");

    public static readonly Error NotFound = new("Resource.NotFound", "Recurso não encontrado.");
    public static readonly Error Forbidden = new("Resource.Forbidden", "Acesso não autorizado.");
    public static readonly Error CannotDelete = new("Resource.CannotDelete", "Não é possível excluir este recurso pois está sendo utilizado.");
    public static readonly Error WrongPassword = new("Auth.WrongPassword", "Senha atual incorreta.");
    public static readonly Error EmailInUse = new("Auth.EmailInUse", "Este email já está em uso.");
    public static readonly Error SameAccount = new("Transaction.SameAccount", "Conta de origem e destino não podem ser iguais.");
    public static readonly Error TransferRequiresDestination = new("Transaction.TransferRequiresDestination", "Transferência requer conta de destino.");
    public static readonly Error PasswordMismatch = new("Auth.PasswordMismatch", "Confirmação de senha não confere.");
    public static readonly Error TooManyRequests = new("Auth.TooManyRequests", "Muitas tentativas. Tente novamente mais tarde.");
}
