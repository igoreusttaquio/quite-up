namespace QuiteUp.Application.Events;

public record ForgotPasswordRequestedEvent(string Email, string Name, string Token);
