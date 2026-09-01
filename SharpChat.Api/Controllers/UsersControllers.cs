using Microsoft.AspNetCore.Mvc;
using SharpChat.Api.Data;
using SharpChat.Api.Models;

namespace SharpChat.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersControllers : ControllerBase
    {
        private readonly AppDbContext _db;

        public UsersControllers(AppDbContext db)
        {
            _db = db;
        }

        [HttpPost]
        public async Task<ActionResult<User>> CreateUser([FromBody] CreateUserRequest request)
        {
            var user = new User { Id = Guid.NewGuid(), Username = request.Username };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<User>> GetUser(Guid id)
        {
            throw new NotImplementedException();
        }
    }

    public record CreateUserRequest(string Username);
}
