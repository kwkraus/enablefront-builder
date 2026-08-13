namespace EnableFront.Builder.Domain.Entities;

public class WarmAccountEntry
{
    public string AccountDomain { get; set; } = string.Empty;
    public WarmRule WarmRule { get; set; }
}
