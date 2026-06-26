namespace QuiteUp.Application.Events;

public record UserRegisteredEvent(string Email, string Name, string Token);
