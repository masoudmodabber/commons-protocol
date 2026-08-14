namespace Commons.Domain.Participants;

public sealed class DomainRuleViolationException(string message) : Exception(message);
