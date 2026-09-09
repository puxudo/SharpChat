using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SharpChat.Api.Data;
using SharpChat.Api.Models;

namespace SharpChat.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _db;

        public UsersController(AppDbContext db)
        {
            _db = db;
        }

        [HttpPost("register")]
        public async Task<ActionResult<UserDto>> Register([FromBody] RegisterRequest request)
        {
            var usernameTaken = await _db.Users.AnyAsync(u => u.Username == request.Username);
            if (usernameTaken)
            {
                return Conflict("That username already exists.");
            }

            var user = new User
            {
                Id = Guid.NewGuid(),
                Username = request.Username,
                Name = request.Name,
            };

            var hasher = new PasswordHasher<User>();
            user.Passwordhash = hasher.HashPassword(user, request.Password);

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            var token = GenerateToken(user);
            return Ok(new AuthResponse(ToDto(user), token));
        }

        [HttpPost("login")]
        public async Task<ActionResult<UserDto>> Login([FromBody] LoginRequest request)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Username == request.Username);

            if (user is null)
            {
                return Unauthorized("Invalid username or password");
            }

            var hasher = new PasswordHasher<User>();
            var result = hasher.VerifyHashedPassword(user, user.Passwordhash, request.Password);

            if (result == PasswordVerificationResult.Failed)
            {
                return Unauthorized("Invalid username or password");
            }
            var token = GenerateToken(user);
            return Ok(new AuthResponse(ToDto(user), token));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<UserDto>> GetUser(Guid id)
        {
            var user = await _db.Users.FindAsync(id);

            if (user is null)
                return NotFound();

            return Ok(ToDto(user));
        }

        [HttpGet("search")]
        public async Task<ActionResult<List<UserDto>>> SearchUsers([FromQuery] string username)
        {
            if (string.IsNullOrWhiteSpace(username))
            {
                return Ok(new List<UserDto>());
            }

            var users = await _db
                .Users.Where(u => u.Username.Contains(username))
                .Take(20)
                .ToListAsync();

            return Ok(users.Select(ToDto).ToList());
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(Guid id, [FromBody] CreateUserRequest request)
        {
            var user = await _db.Users.FindAsync(id);

            if (user is null)
            {
                return NotFound();
            }

            user.Username = request.Username;
            await _db.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            var user = await _db.Users.FindAsync(id);

            if (user is null)
            {
                return NotFound();
            }

            _db.Users.Remove(user);
            await _db.SaveChangesAsync();

            return NoContent();
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<ActionResult<UserDto>> GetMe()
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var user = await _db.Users.FindAsync(userId);

            if (user is null)
                return NotFound();

            return Ok(ToDto(user));
        }

        private string GenerateToken(User user)
        {
            var jwtKey = HttpContext.RequestServices.GetRequiredService<IConfiguration>()[
                "Jwt:Key"
            ];

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private static UserDto ToDto(User user) => new(user.Id, user.Username, user.Name);
    }

    public record AuthResponse(UserDto User, string Token);

    public record CreateUserRequest(string Username);

    public record UserDto(Guid Id, string Username, string Name);

    public record RegisterRequest(string Username, string Name, string Password);

    public record LoginRequest(string Username, string Password);
}
