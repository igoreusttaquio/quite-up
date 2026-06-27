using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QuiteUp.Domain.Entities;

namespace QuiteUp.Infrastructure.Persistence.Configurations;

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("notifications");

        builder.HasKey(n => n.Id);
        builder.Property(n => n.Id).HasColumnName("id").UseIdentityAlwaysColumn();
        builder.Property(n => n.CreatedAt).HasColumnName("created_at");
        builder.Property(n => n.UpdatedAt).HasColumnName("updated_at");

        builder.Property(n => n.UserId).HasColumnName("user_id");
        builder.Property(n => n.Title).HasColumnName("title").IsRequired().HasMaxLength(200);
        builder.Property(n => n.Message).HasColumnName("message").IsRequired().HasMaxLength(2000);
        builder.Property(n => n.Type).HasColumnName("type").IsRequired().HasMaxLength(20);
        builder.Property(n => n.IsRead).HasColumnName("is_read");
        builder.Property(n => n.ReferenceType).HasColumnName("reference_type").HasMaxLength(50);
        builder.Property(n => n.ReferenceId).HasColumnName("reference_id").HasMaxLength(50);

        builder.HasOne(n => n.User)
            .WithMany(u => u.Notifications)
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(n => new { n.UserId, n.IsRead }).HasDatabaseName("ix_notifications_user_id_is_read");
    }
}
