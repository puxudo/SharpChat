using Microsoft.EntityFrameworkCore;
using SharpChat.Api.Data;
using SharpChat.Api.Hubs;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

var connectionString =
    builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));

builder.Services.AddSignalR();

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "AllowReactDev",
        policy =>
        {
            policy
                .WithOrigins("http://localhost:5173", "https://sharpchat-ui.onrender.com")
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        }
    );
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

app.UseCors("AllowReactDev");

app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat");

app.Run();
