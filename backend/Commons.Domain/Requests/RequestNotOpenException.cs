namespace Commons.Domain.Requests;

public sealed class RequestNotOpenException(string message) : Exception(message);
