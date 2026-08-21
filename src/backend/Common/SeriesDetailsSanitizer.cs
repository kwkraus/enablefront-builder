using System.Net;
using System.Text;
using System.Text.RegularExpressions;

namespace EnableFront.Builder.Common;

/// <summary>
/// Sanitizes user-submitted series details HTML down to a constrained allow-list: paragraphs,
/// line breaks, bulleted lists, and bold/italic/underline emphasis, plus plain text.
/// </summary>
/// <remarks>
/// Sanitization pipeline:
/// <list type="number">
///   <item>Strip HTML comments and declarations (e.g. <c>&lt;!-- --&gt;</c>, <c>&lt;!DOCTYPE&gt;</c>) entirely.</item>
///   <item>Tokenize the remaining fragment into tags and text runs. Malformed/unrecognized angle
///         brackets are treated as literal text rather than throwing.</item>
///   <item>Canonicalize legacy aliases (<c>b</c>&#8594;<c>strong</c>, <c>i</c>&#8594;<c>em</c>) and strip all
///         attributes from allowed tags.</item>
///   <item>Drop unsupported wrapper elements (e.g. <c>a</c>, <c>img</c>, <c>table</c>, headings) while
///         preserving their inner text.</item>
///   <item>Drop unsafe elements (e.g. <c>script</c>, <c>style</c>, <c>iframe</c>) along with their content.</item>
///   <item>Decode entities once to compute the underlying plain-text length, then re-encode text runs
///         for safe storage/rendering.</item>
///   <item>Collapse whitespace-only results to <see langword="null"/>.</item>
/// </list>
/// The server is the sole authority for this sanitization; it must be applied before persistence
/// regardless of what the client editor already did.
/// </remarks>
public static class SeriesDetailsSanitizer
{
    /// <summary>Maximum number of decoded plain-text characters allowed, excluding markup.</summary>
    public const int MaxPlainTextLength = 10_000;

    private static readonly Regex CommentOrDeclarationPattern = new(
        @"<!--.*?-->|<!\[CDATA\[.*?\]\]>|<![^>]*>|<\?.*?\?>",
        RegexOptions.Compiled | RegexOptions.Singleline, TimeSpan.FromSeconds(2));

    private static readonly Regex TagPattern = new(
        @"<(?<closing>/)?(?<name>[a-zA-Z][a-zA-Z0-9]*)(?<attrs>[^<>]*?)(?<selfclose>/)?>",
        RegexOptions.Compiled, TimeSpan.FromSeconds(2));

    /// <summary>Tags that are kept, with attributes stripped and mapped to a canonical output name.</summary>
    private static readonly Dictionary<string, string> AllowedTagCanonicalNames = new(StringComparer.OrdinalIgnoreCase)
    {
        ["p"] = "p",
        ["br"] = "br",
        ["ul"] = "ul",
        ["li"] = "li",
        ["strong"] = "strong",
        ["b"] = "strong",
        ["em"] = "em",
        ["i"] = "em",
        ["u"] = "u",
    };

    /// <summary>Canonical allowed tag names that never require a closing tag.</summary>
    private static readonly HashSet<string> VoidTags = new(StringComparer.OrdinalIgnoreCase) { "br" };

    /// <summary>Tags that cannot be nested beneath an open paragraph without first closing it.</summary>
    private static readonly HashSet<string> BlockTags = new(StringComparer.OrdinalIgnoreCase) { "p", "ul", "li" };

    /// <summary>Tags whose element AND text content are discarded entirely (unsafe/executable content).</summary>
    private static readonly HashSet<string> DropWithContentTags = new(StringComparer.OrdinalIgnoreCase)
    {
        "script", "style", "iframe", "object", "embed", "noscript", "svg",
        "form", "input", "button", "select", "textarea", "video", "audio", "source", "template"
    };

    /// <summary>
    /// Sanitizes <paramref name="rawHtml"/> to the constrained allow-list and computes the decoded
    /// plain-text length of the result.
    /// </summary>
    public static SeriesDetailsSanitizeResult Sanitize(string? rawHtml)
    {
        if (string.IsNullOrEmpty(rawHtml))
            return new SeriesDetailsSanitizeResult(null, 0);

        var fragment = CommentOrDeclarationPattern.Replace(rawHtml, string.Empty);

        var output = new StringBuilder();
        var plainText = new StringBuilder();
        var emitStack = new Stack<string>();
        var suppressStack = new Stack<string>();

        void AppendText(string raw)
        {
            if (raw.Length == 0 || suppressStack.Count > 0)
                return;

            var decoded = WebUtility.HtmlDecode(raw);
            if (decoded.Length == 0)
                return;

            plainText.Append(decoded);
            output.Append(WebUtility.HtmlEncode(decoded));
        }

        var lastIndex = 0;
        foreach (Match match in TagPattern.Matches(fragment))
        {
            AppendText(fragment[lastIndex..match.Index]);
            lastIndex = match.Index + match.Length;

            var name = match.Groups["name"].Value;
            var isClosing = match.Groups["closing"].Success;
            var isSelfClosing = match.Groups["selfclose"].Success || VoidTags.Contains(name);

            if (suppressStack.Count > 0)
            {
                if (!isSelfClosing)
                {
                    if (!isClosing)
                        suppressStack.Push(name);
                    else
                        suppressStack.Pop();
                }
                continue;
            }

            if (DropWithContentTags.Contains(name))
            {
                if (!isClosing && !isSelfClosing)
                    suppressStack.Push(name);
                continue;
            }

            if (AllowedTagCanonicalNames.TryGetValue(name, out var canonical))
            {
                if (isSelfClosing)
                {
                    output.Append('<').Append(canonical).Append('>');
                    if (!VoidTags.Contains(canonical))
                        output.Append("</").Append(canonical).Append('>');
                }
                else if (!isClosing)
                {
                    // Normalize invalid HTML that browsers would automatically split
                    // into sibling blocks, e.g. `<p>Before<ul>...` becomes
                    // `<p>Before</p><ul>...`.
                    while (emitStack.Count > 0 && emitStack.Peek() == "p" && BlockTags.Contains(canonical))
                    {
                        var closingParagraph = emitStack.Pop();
                        output.Append("</").Append(closingParagraph).Append('>');
                    }

                    output.Append('<').Append(canonical).Append('>');
                    emitStack.Push(canonical);
                }
                else if (emitStack.Contains(canonical))
                {
                    while (emitStack.Count > 0)
                    {
                        var top = emitStack.Pop();
                        output.Append("</").Append(top).Append('>');
                        if (top == canonical)
                            break;
                    }
                }
                // else: stray closing tag with no matching open tag — ignore.

                continue;
            }

            // Unknown/unsupported wrapper tag (e.g. a, img, table, h1): drop the tag itself but keep
            // any nested content, which flows through as ordinary text/allowed-tag processing.
        }

        AppendText(fragment[lastIndex..]);

        // Auto-close any tags left open, defending against unclosed/malformed fragments.
        while (emitStack.Count > 0)
            output.Append("</").Append(emitStack.Pop()).Append('>');

        var plainTextLength = plainText.Length;

        return plainText.ToString().Trim().Length == 0
            ? new SeriesDetailsSanitizeResult(null, plainTextLength)
            : new SeriesDetailsSanitizeResult(output.ToString(), plainTextLength);
    }
}

/// <summary>
/// Result of sanitizing series details: the canonical sanitized HTML (or <see langword="null"/> when
/// the content was empty/whitespace-only) plus the decoded plain-text length used for validation.
/// </summary>
public readonly record struct SeriesDetailsSanitizeResult(string? SanitizedHtml, int PlainTextLength)
{
    /// <summary>Whether <see cref="PlainTextLength"/> exceeds <see cref="SeriesDetailsSanitizer.MaxPlainTextLength"/>.</summary>
    public bool ExceedsMaxLength => PlainTextLength > SeriesDetailsSanitizer.MaxPlainTextLength;
}