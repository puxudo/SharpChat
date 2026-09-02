namespace SharpChat.Api.Models
{
    public class Message
    {
        public Guid Id { get; set; }
        public Guid SenderId { get; set; }
        public Guid RecipientId { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime SentAt { get; set; } = DateTime.UtcNow;

        public User Sender { get; set; } = null!;
        public User Recipient { get; set; } = null!;
    }
}
