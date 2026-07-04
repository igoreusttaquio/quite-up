using QuiteUp.Domain.Common;

namespace QuiteUp.Domain.Entities;

public class Attachment : BaseEntity
{
    public long UserId { get; set; }
    public long TransactionId { get; set; }
    public string FileName { get; set; } = null!;
    public string ContentType { get; set; } = null!;
    public long FileSize { get; set; }
    public byte[] Data { get; set; } = null!;

    public User User { get; set; } = null!;
    public Transaction Transaction { get; set; } = null!;
}
