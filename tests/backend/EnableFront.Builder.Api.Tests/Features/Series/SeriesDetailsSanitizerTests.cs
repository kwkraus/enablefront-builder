using EnableFront.Builder.Common;
using FluentAssertions;

namespace EnableFront.Builder.Api.Tests.Features.Series;

public class SeriesDetailsSanitizerTests
{
    // ---------- Allowed tags preserved ----------

    [Fact]
    public void Sanitize_PreservesAllowedStructuralTags()
    {
        var result = SeriesDetailsSanitizer.Sanitize("<p>Intro</p><ul><li>One</li><li>Two</li></ul>");

        result.SanitizedHtml.Should().Be("<p>Intro</p><ul><li>One</li><li>Two</li></ul>");
    }

    [Fact]
    public void Sanitize_PreservesAllowedInlineFormatting()
    {
        var result = SeriesDetailsSanitizer.Sanitize("<p><strong>Bold</strong> <em>Italic</em> <u>Underline</u></p>");

        result.SanitizedHtml.Should().Be("<p><strong>Bold</strong> <em>Italic</em> <u>Underline</u></p>");
    }

    [Theory]
    [InlineData("Line one<br>Line two", "Line one<br>Line two")]
    [InlineData("Line one<br/>Line two", "Line one<br>Line two")]
    [InlineData("Line one<br />Line two", "Line one<br>Line two")]
    public void Sanitize_PreservesLineBreaks_RegardlessOfSelfCloseStyle(string input, string expected)
    {
        SeriesDetailsSanitizer.Sanitize(input).SanitizedHtml.Should().Be(expected);
    }

    [Fact]
    public void Sanitize_PreservesCombinedFormattingAndBulletedList()
    {
        const string input =
            "<p>Attend to <strong>learn</strong> and <em>grow</em> with <u>hands-on</u> practice.</p>" +
            "<ul><li>Outcome one</li><li>Outcome <strong>two</strong></li></ul>";

        var result = SeriesDetailsSanitizer.Sanitize(input);

        result.SanitizedHtml.Should().Be(input);
    }

    // ---------- b/i canonicalization ----------

    [Theory]
    [InlineData("<b>Bold</b>", "<strong>Bold</strong>")]
    [InlineData("<i>Italic</i>", "<em>Italic</em>")]
    [InlineData("<B>Bold</B>", "<strong>Bold</strong>")]
    public void Sanitize_CanonicalizesLegacyTags_ToStrongAndEm(string input, string expected)
    {
        SeriesDetailsSanitizer.Sanitize(input).SanitizedHtml.Should().Be(expected);
    }

    // ---------- Attribute stripping ----------

    [Fact]
    public void Sanitize_StripsAttributesFromAllowedTags()
    {
        var result = SeriesDetailsSanitizer.Sanitize("<p class=\"x\" style=\"color:red\" onclick=\"evil()\">Safe</p>");

        result.SanitizedHtml.Should().Be("<p>Safe</p>");
    }

    // ---------- Unsupported scripts ----------

    [Fact]
    public void Sanitize_RemovesScriptTags_AndTheirContent()
    {
        var result = SeriesDetailsSanitizer.Sanitize("<p>Before</p><script>alert('x')</script><p>After</p>");

        result.SanitizedHtml.Should().Be("<p>Before</p><p>After</p>");
    }

    [Fact]
    public void Sanitize_RemovesStyleTags_AndTheirContent()
    {
        var result = SeriesDetailsSanitizer.Sanitize("<style>body{color:red}</style><p>Content</p>");

        result.SanitizedHtml.Should().Be("<p>Content</p>");
    }

    [Fact]
    public void Sanitize_DoesNotCountScriptContent_TowardPlainTextLength()
    {
        var result = SeriesDetailsSanitizer.Sanitize("<script>" + new string('x', 500) + "</script><p>Hi</p>");

        result.PlainTextLength.Should().Be(2);
    }

    // ---------- Unsupported links ----------

    [Fact]
    public void Sanitize_RemovesLinks_ButPreservesAnchorText()
    {
        var result = SeriesDetailsSanitizer.Sanitize("<p>Visit <a href=\"https://evil.example\">our site</a> today</p>");

        result.SanitizedHtml.Should().Be("<p>Visit our site today</p>");
    }

    // ---------- Unsupported images ----------

    [Fact]
    public void Sanitize_RemovesImages_Entirely()
    {
        var result = SeriesDetailsSanitizer.Sanitize("<p>Look<img src=\"x.png\" alt=\"x\"/>here</p>");

        result.SanitizedHtml.Should().Be("<p>Lookhere</p>");
    }

    // ---------- Unsupported tables ----------

    [Fact]
    public void Sanitize_RemovesTableStructure_ButPreservesCellText()
    {
        var result = SeriesDetailsSanitizer.Sanitize("<table><tr><td>Cell one</td><td>Cell two</td></tr></table>");

        result.SanitizedHtml.Should().Be("Cell oneCell two");
    }

    // ---------- Unsupported numbered lists / headings ----------

    [Fact]
    public void Sanitize_RemovesHeadingWrapper_ButPreservesText()
    {
        var result = SeriesDetailsSanitizer.Sanitize("<h1>Title</h1><p>Body</p>");

        result.SanitizedHtml.Should().Be("Title<p>Body</p>");
    }

    // ---------- Safe text preservation ----------

    [Fact]
    public void Sanitize_PreservesPlainText_Unmodified()
    {
        var result = SeriesDetailsSanitizer.Sanitize("Just plain text with no markup.");

        result.SanitizedHtml.Should().Be("Just plain text with no markup.");
    }

    [Fact]
    public void Sanitize_EncodesSpecialCharacters_InText()
    {
        var result = SeriesDetailsSanitizer.Sanitize("<p>5 &lt; 10 &amp; 10 &gt; 5</p>");

        result.SanitizedHtml.Should().Be("<p>5 &lt; 10 &amp; 10 &gt; 5</p>");
    }

    // ---------- Empty-to-null normalization ----------

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("<p></p>")]
    [InlineData("<p>   </p>")]
    [InlineData("<ul><li></li></ul>")]
    public void Sanitize_ReturnsNull_ForEmptyOrWhitespaceOnlyContent(string? input)
    {
        var result = SeriesDetailsSanitizer.Sanitize(input);

        result.SanitizedHtml.Should().BeNull();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("<p></p>")]
    [InlineData("<ul><li></li></ul>")]
    public void Sanitize_ReportsZeroPlainTextLength_WhenNoUnderlyingCharactersExist(string? input)
    {
        var result = SeriesDetailsSanitizer.Sanitize(input);

        result.PlainTextLength.Should().Be(0);
    }

    // ---------- Malformed fragments ----------

    [Fact]
    public void Sanitize_HandlesUnclosedTags_WithoutThrowing()
    {
        var act = () => SeriesDetailsSanitizer.Sanitize("<p>Unclosed paragraph<ul><li>Item");

        act.Should().NotThrow();
    }

    [Fact]
    public void Sanitize_AutoClosesUnclosedTags()
    {
        var result = SeriesDetailsSanitizer.Sanitize("<p>Unclosed");

        result.SanitizedHtml.Should().Be("<p>Unclosed</p>");
    }

    [Fact]
    public void Sanitize_HandlesStrayAngleBrackets_AsLiteralText()
    {
        var result = SeriesDetailsSanitizer.Sanitize("<p>1 < 2 and 3 > 2</p>");

        result.SanitizedHtml.Should().Be("<p>1 &lt; 2 and 3 &gt; 2</p>");
    }

    [Fact]
    public void Sanitize_HandlesStrayClosingTags_WithoutThrowing()
    {
        var act = () => SeriesDetailsSanitizer.Sanitize("Text</strong> after stray close");

        act.Should().NotThrow();
        SeriesDetailsSanitizer.Sanitize("Text</strong> after stray close").SanitizedHtml
            .Should().Be("Text after stray close");
    }

    // ---------- Decoded plain-text length validation ----------

    [Fact]
    public void Sanitize_CountsDecodedPlainTextLength_ExcludingMarkup()
    {
        var result = SeriesDetailsSanitizer.Sanitize("<p><strong>Hello</strong></p>");

        result.PlainTextLength.Should().Be(5);
    }

    [Fact]
    public void Sanitize_CountsDecodedEntities_AsSingleCharacters()
    {
        var result = SeriesDetailsSanitizer.Sanitize("A&amp;B");

        result.PlainTextLength.Should().Be(3);
    }

    [Fact]
    public void Sanitize_DoesNotExceedMaxLength_AtExactly10000Characters()
    {
        var text = new string('a', SeriesDetailsSanitizer.MaxPlainTextLength);

        var result = SeriesDetailsSanitizer.Sanitize($"<p>{text}</p>");

        result.PlainTextLength.Should().Be(SeriesDetailsSanitizer.MaxPlainTextLength);
        result.ExceedsMaxLength.Should().BeFalse();
    }

    [Fact]
    public void Sanitize_ExceedsMaxLength_AtOneOver10000Characters()
    {
        var text = new string('a', SeriesDetailsSanitizer.MaxPlainTextLength + 1);

        var result = SeriesDetailsSanitizer.Sanitize($"<p>{text}</p>");

        result.PlainTextLength.Should().Be(SeriesDetailsSanitizer.MaxPlainTextLength + 1);
        result.ExceedsMaxLength.Should().BeTrue();
    }
}