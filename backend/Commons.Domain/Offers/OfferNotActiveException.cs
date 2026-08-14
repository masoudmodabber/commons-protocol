namespace Commons.Domain.Offers;

public sealed class OfferNotActiveException(string message) : Exception(message);
