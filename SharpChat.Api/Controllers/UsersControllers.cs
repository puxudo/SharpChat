using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
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
        private readonly IConfiguration _config;

        public UsersController(AppDbContext db, IConfiguration config)
        {
            _db = db;
            _config = config;
        }

        [HttpPost("register")]
        public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
        {
            var normalized = request.Username.Trim().ToUpperInvariant();

            var usernameTaken = await _db.Users.AnyAsync(u => u.NormalizedUsername == normalized);
            if (usernameTaken)
            {
                return Conflict("That username is already taken.");
            }

            var user = new User
            {
                Id = Guid.NewGuid(),
                Username = request.Username.Trim(),
                NormalizedUsername = normalized,
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
        public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
        {
            var normalized = request.Username.Trim().ToUpperInvariant();
            var user = await _db.Users.FirstOrDefaultAsync(u => u.NormalizedUsername == normalized);

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

            var normalized = username.Trim().ToUpperInvariant();

            var users = await _db
                .Users.Where(u => u.NormalizedUsername!.Contains(normalized))
                .Take(20)
                .ToListAsync();

            return Ok(users.Select(ToDto).ToList());
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UpdateUserRequest request)
        {
            var user = await _db.Users.FindAsync(id);
            if (user is null)
                return NotFound();

            user.Name = request.Name;
            user.AvatarEmoji = request.AvatarEmoji;
            await _db.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            var user = await _db.Users.FindAsync(id);
            if (user is null)
                return NotFound();

            _db.Users.Remove(user);
            await _db.SaveChangesAsync();

            return NoContent();
        }

        private string GenerateToken(User user)
        {
            var jwtKey = _config["Jwt:Key"]!;

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

        private static UserDto ToDto(User user) =>
            new(user.Id, user.Username, user.Name, user.AvatarEmoji);
    }

    public record CreateUserRequest(string Username);

    public record UpdateUserRequest(string Name, string? AvatarEmoji);

    public record UserDto(Guid Id, string Username, string Name, string? AvatarEmoji);

    public record RegisterRequest(string Username, string Name, string Password);

    public record LoginRequest(string Username, string Password);

    public record AuthResponse(UserDto User, string Token);
}
