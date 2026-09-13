using FluentValidation;

namespace QuiteUp.Application.Features.Profile.Commands.UploadProfilePhoto;

public class UploadProfilePhotoCommandValidator : AbstractValidator<UploadProfilePhotoCommand>
{
    public const long MaxFileSizeBytes = 5 * 1024 * 1024;

    private static readonly string[] AllowedContentTypes =
        ["image/jpeg", "image/png", "image/webp"];

    private static readonly string[] AllowedExtensions =
        [".jpg", ".jpeg", ".png", ".webp"];

    public UploadProfilePhotoCommandValidator()
    {
        RuleFor(x => x.Data)
            .NotNull().WithMessage("Arquivo de imagem é obrigatório.")
            .Must(data => data is { Length: > 0 }).WithMessage("Arquivo de imagem é obrigatório.")
            .Must(data => data is null || data.Length <= MaxFileSizeBytes)
            .WithMessage("A imagem deve ter no máximo 5 MB.")
            .Must(data => data is not null && IsSupportedImage(data))
            .WithMessage("Arquivo de imagem inválido ou corrompido.");

        RuleFor(x => x.ContentType)
            .NotEmpty().WithMessage("Tipo de conteúdo é obrigatório.")
            .Must(ct => ct is not null && AllowedContentTypes.Contains(ct.ToLowerInvariant()))
            .WithMessage("Formato inválido. Use JPG, JPEG, PNG ou WEBP.");

        RuleFor(x => x.FileName)
            .NotEmpty().WithMessage("Nome do arquivo é obrigatório.")
            .Must(name => name is not null && AllowedExtensions.Contains(Path.GetExtension(name).ToLowerInvariant()))
            .WithMessage("Extensão inválida. Use JPG, JPEG, PNG ou WEBP.");
    }

    private static bool IsSupportedImage(byte[] data)
    {
        if (data.Length < 12)
            return false;

        // JPEG: FF D8 FF
        if (data[0] == 0xFF && data[1] == 0xD8 && data[2] == 0xFF)
            return true;

        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if (data[0] == 0x89 && data[1] == 0x50 && data[2] == 0x4E && data[3] == 0x47
            && data[4] == 0x0D && data[5] == 0x0A && data[6] == 0x1A && data[7] == 0x0A)
            return true;

        // WEBP: "RIFF" .... "WEBP"
        if (data[0] == (byte)'R' && data[1] == (byte)'I' && data[2] == (byte)'F' && data[3] == (byte)'F'
            && data[8] == (byte)'W' && data[9] == (byte)'E' && data[10] == (byte)'B' && data[11] == (byte)'P')
            return true;

        return false;
    }
}
