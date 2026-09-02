using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SharpChat.Api.Data;
using SharpChat.Api.Models;

namespace SharpChat.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MessagesController : ControllerBase
    {
        private readonly AppDbContext _db;

        public MessagesController(AppDbContext db)
        {
            _db = db;
        }

        [HttpPost]
        public async Task<ActionResult<Message>> SendMessage([FromBody] SendMessageRequest request)
        {
            var senderExists = await _db.Users.AnyAsync(u => u.Id == request.SenderId);
            var recipientExists = await _db.Users.AnyAsync(u => u.Id == request.RecipientId);

            if (!senderExists || !recipientExists)
            {
                return BadRequest("SenderId or RecipientId doesn't correspond to an existing User");
            }

            var message = new Message
            {
                Id = Guid.NewGuid(),
                SenderId = request.SenderId,
                RecipientId = request.RecipientId,
                Content = request.Content,
            };

            _db.Messages.Add(message);
            await _db.SaveChangesAsync();

            return Ok(message);
        }

        [HttpGet("conversation")]
        public async Task<ActionResult<List<Message>>> GetConversation(
            [FromQuery] Guid userA,
            [FromQuery] Guid userB
        )
        {
            var messages = await _db
                .Messages.Where(m =>
                    (m.SenderId == userA && m.RecipientId == userB)
                    || (m.SenderId == userB && m.RecipientId == userA)
                )
                .OrderBy(m => m.SentAt)
                .ToListAsync();

            return Ok(messages);
        }

        public record SendMessageRequest(Guid SenderId, Guid RecipientId, string Content);
    }
}
