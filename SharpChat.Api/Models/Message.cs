namespace SharpChat.Api.Models;

public class Message
{
    public Guid Id { get; set; }
    public Guid SenderId { get; set; }
    public Guid RecipientId { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    public bool IsRead { get; set; } = false;
    public string? FileUrl { get; set; }
    public string? FileName { get; set; }
    public string? FileType { get; set; }
    public Guid? ReplyToMessageId { get; set; }

    public User Sender { get; set; } = null!;
    public User Recipient { get; set; } = null!;
    public Message? ReplyToMessage { get; set; }
}
