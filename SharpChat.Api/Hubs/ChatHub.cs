using Microsoft.AspNetCore.SignalR;

namespace SharpChat.Api.Hubs
{
    public class ChatHub : Hub
    {
        public async Task JoinConversation(string userId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, userId);
        }
    }
}
