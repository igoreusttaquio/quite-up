using HashidsNet;
using QuiteUp.Application.Common.Interfaces;

namespace QuiteUp.Infrastructure.Services;

public class IdEncoderService(IHashids hashids) : IIdEncoder
{
    public string Encode(long id) => hashids.EncodeLong(id);

    public long? Decode(string id)
    {
        var numbers = hashids.DecodeLong(id);
        return numbers.Length > 0 ? numbers[0] : null;
    }
}
