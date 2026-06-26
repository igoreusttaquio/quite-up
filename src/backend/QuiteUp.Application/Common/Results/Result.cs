namespace QuiteUp.Application.Common.Results;

public class Result<T>
{
    public T? Value { get; }
    public Error Error { get; }
    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;

    private Result(T value) { Value = value; Error = Error.None; IsSuccess = true; }
    private Result(Error error) { Error = error; IsSuccess = false; }

    public static Result<T> Success(T value) => new(value);
    public static Result<T> Failure(Error error) => new(error);
}

public class Result
{
    public Error Error { get; }
    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;

    private Result() { Error = Error.None; IsSuccess = true; }
    private Result(Error error) { Error = error; IsSuccess = false; }

    public static Result Success() => new();
    public static Result Failure(Error error) => new(error);
}
