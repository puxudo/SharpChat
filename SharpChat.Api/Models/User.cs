namespace SharpChat.Api.Models
{
    public class User
    {
        public Guid Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string? NormalizedUsername { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Passwordhash { get; set; } = string.Empty;
        public string? AvatarEmoji { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
