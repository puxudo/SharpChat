using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using SharpChat.Api.Data;
using SharpChat.Api.Hubs;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=Sharpchat.db")
);
builder.Services.AddSignalR();
builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "AllowReactDev",
        policy =>
        {
            policy
                .WithOrigins("http://localhost:5173", "https://sharpchat-ui.onrender.com/")
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        }
    );
});

var app = builder.Build();

app.UseHttpsRedirection();
app.UseCors("AllowReactDev");

app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat");

app.Run();
