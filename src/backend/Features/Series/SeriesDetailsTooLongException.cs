namespace EnableFront.Builder.Features.Series;

/// <summary>
/// Thrown when submitted series details exceed the maximum allowed decoded plain-text length.
/// Callers (endpoints) should translate this into a 400 validation error and must not persist
/// any partial change to the series when it is thrown.
/// </summary>
public sealed class SeriesDetailsTooLongException : Exception
{
    public SeriesDetailsTooLongException(string message) : base(message)
    {
    }
}