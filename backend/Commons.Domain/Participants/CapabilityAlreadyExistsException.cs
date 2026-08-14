namespace Commons.Domain.Participants;

public sealed class CapabilityAlreadyExistsException(string message)
    : DomainRuleViolationException(message);
