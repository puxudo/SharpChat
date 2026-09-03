using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using SharpChat.Api.Data;
using SharpChat.Api.Hubs;
using SharpChat.Api.Models;

namespace SharpChat.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MessagesController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IHubContext<ChatHub> _hubContext;

        public MessagesController(AppDbContext db, IHubContext<ChatHub> hubContext)
        {
            _db = db;
            _hubContext = hubContext;
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
            // pushing the message on db
            _db.Messages.Add(message);
            await _db.SaveChangesAsync();

            //pushing real-time event to the recipient's signalR group
            await _hubContext
                .Clients.Group(request.RecipientId.ToString())
                .SendAsync("ReceiveMessage", message);

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

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMessage(Guid id)
        {
            var message = await _db.Messages.FindAsync(id);
            if (message == null)
            {
                return NotFound();
            }
            _db.Messages.Remove(message);
            await _db.SaveChangesAsync();

            return NoContent();
        }

        public record SendMessageRequest(Guid SenderId, Guid RecipientId, string Content);
    }
}
