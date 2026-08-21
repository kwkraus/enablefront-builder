namespace EnableFront.Builder.Features.Sessions;

/// <summary>
/// Normalizes and validates the optional session registration URL.
/// </summary>
/// <remarks>
/// Validation is shape-only: the destination is never contacted or resolved. Rules
/// are intentionally provider-agnostic (Microsoft Teams, Zoom, Webex, etc. are all
/// accepted equally):
/// <list type="bullet">
///   <item>Surrounding whitespace is trimmed before validating or storing.</item>
///   <item>An empty or whitespace-only value means "no registration URL" — not an error.</item>
///   <item>The trimmed value must not exceed <see cref="MaxLength"/> characters.</item>
///   <item>The trimmed value must be an absolute URL using the <c>http</c> or <c>https</c> scheme.</item>
/// </list>
/// </remarks>
public static class RegistrationUrlValidator
{
    /// <summary>Maximum allowed length of a trimmed registration URL, in characters.</summary>
    public const int MaxLength = 2048;

    /// <summary>Stable error code returned when the trimmed value exceeds <see cref="MaxLength"/>.</summary>
    public const string TooLongErrorCode = "registration_url_too_long";

    /// <summary>
    /// Stable error code returned when the trimmed value is not an absolute
    /// <c>http</c>/<c>https</c> URL (relative paths, bare domains, malformed
    /// values, and non-web schemes such as <c>javascript:</c> or <c>file:</c>).
    /// </summary>
    public const string InvalidErrorCode = "invalid_registration_url";

    /// <summary>
    /// Normalizes and validates <paramref name="rawValue"/>.
    /// </summary>
    /// <returns>
    /// A tuple where <c>Value</c> is the trimmed URL to persist (or <see langword="null"/>
    /// when the input was empty/whitespace-only), and <c>ErrorCode</c> is <see langword="null"/>
    /// on success or one of the stable error codes above when validation fails. When
    /// <c>ErrorCode</c> is non-null, <c>Value</c> is always <see langword="null"/> so callers
    /// never accidentally persist an invalid URL.
    /// </returns>
    public static (string? Value, string? ErrorCode) Normalize(string? rawValue)
    {
        var trimmed = rawValue?.Trim() ?? string.Empty;

        if (trimmed.Length == 0)
            return (null, null);

        if (trimmed.Length > MaxLength)
            return (null, TooLongErrorCode);

        if (!Uri.TryCreate(trimmed, UriKind.Absolute, out var uri))
            return (null, InvalidErrorCode);

        if (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps)
            return (null, InvalidErrorCode);

        return (trimmed, null);
    }
}