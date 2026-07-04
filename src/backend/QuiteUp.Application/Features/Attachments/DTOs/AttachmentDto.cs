namespace QuiteUp.Application.Features.Attachments.DTOs;

public record AttachmentDto(
    string Id,
    string FileName,
    string ContentType,
    long FileSize,
    DateTime CreatedAt
);

public record AttachmentDataDto(
    string FileName,
    string ContentType,
    byte[] Data
);
