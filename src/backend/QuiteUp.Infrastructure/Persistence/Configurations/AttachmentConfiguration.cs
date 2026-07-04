using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QuiteUp.Domain.Entities;

namespace QuiteUp.Infrastructure.Persistence.Configurations;

public class AttachmentConfiguration : IEntityTypeConfiguration<Attachment>
{
    public void Configure(EntityTypeBuilder<Attachment> builder)
    {
        builder.ToTable("attachments");

        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).HasColumnName("id").UseIdentityAlwaysColumn();
        builder.Property(a => a.CreatedAt).HasColumnName("created_at");
        builder.Property(a => a.UpdatedAt).HasColumnName("updated_at");

        builder.Property(a => a.UserId).HasColumnName("user_id");
        builder.Property(a => a.TransactionId).HasColumnName("transaction_id");
        builder.Property(a => a.FileName).HasColumnName("file_name").HasMaxLength(255);
        builder.Property(a => a.ContentType).HasColumnName("content_type").HasMaxLength(100);
        builder.Property(a => a.FileSize).HasColumnName("file_size");
        builder.Property(a => a.Data).HasColumnName("data");

        builder.HasOne(a => a.User)
            .WithMany()
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.Transaction)
            .WithOne(t => t.Attachment)
            .HasForeignKey<Attachment>(a => a.TransactionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(a => a.TransactionId).HasDatabaseName("ix_attachments_transaction_id").IsUnique();
        builder.HasIndex(a => a.UserId).HasDatabaseName("ix_attachments_user_id");
    }
}
