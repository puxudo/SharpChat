using Microsoft.EntityFrameworkCore;
using SharpChat.Api.Models;

namespace SharpChat.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        public DbSet<User> Users => Set<User>();
        public DbSet<Message> Messages => Set<Message>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasIndex(u => u.Username).IsUnique();
            });

            modelBuilder.Entity<Message>(entity =>
            {
                entity
                    .HasOne(m => m.Sender)
                    .WithMany()
                    .HasForeignKey(m => m.SenderId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity
                    .HasOne(m => m.Recipient)
                    .WithMany()
                    .HasForeignKey(m => m.RecipientId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }
    }
}
