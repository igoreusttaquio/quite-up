using QuiteUp.Domain.Common;

namespace QuiteUp.Domain.Entities;

public class EmailVerificationToken : BaseEntity
{
    public long UserId { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public bool IsUsed { get; set; }
    public bool IsEmailChange { get; set; }

    public User User { get; set; } = null!;
}
