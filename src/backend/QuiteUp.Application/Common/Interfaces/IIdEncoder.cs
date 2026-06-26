namespace QuiteUp.Application.Common.Interfaces;

public interface IIdEncoder
{
    string Encode(long id);
    long? Decode(string id);
}
