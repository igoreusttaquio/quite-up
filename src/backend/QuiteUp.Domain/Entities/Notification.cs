using QuiteUp.Domain.Common;

namespace QuiteUp.Domain.Entities;

public class Notification : BaseEntity
{
    public long UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = "info";
    public bool IsRead { get; set; }
    public string? ReferenceType { get; set; }
    public string? ReferenceId { get; set; }

    public User User { get; set; } = null!;
}
