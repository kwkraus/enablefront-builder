using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace EnableFront.Builder.Api.Tests.Features.Series;

/// <summary>
/// Test-only authentication handler used by <see cref="SeriesApiWebApplicationFactory"/> in place
/// of the real Microsoft Identity Web / Entra ID authentication used at runtime. Authenticates the
/// request using the caller-supplied "oid" claim from the <see cref="OidHeaderName"/> header, or
/// leaves the request unauthenticated when the header is absent, so tests can exercise both
/// authenticated and anonymous flows without a real token issuer.
/// </summary>
public sealed class TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public const string SchemeName = "Test";
    public const string OidHeaderName = "X-Test-Oid";

    public TestAuthHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder)
        : base(options, logger, encoder)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue(OidHeaderName, out var oidValues) ||
            string.IsNullOrWhiteSpace(oidValues.ToString()))
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        var claims = new[] { new Claim("oid", oidValues.ToString()) };
        var identity = new ClaimsIdentity(claims, SchemeName);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, SchemeName);
        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}