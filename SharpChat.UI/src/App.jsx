import { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import {
    MainContainer,
    ChatContainer,
    MessageList,
    Message,
    MessageInput,
} from "@chatscope/chat-ui-kit-react";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";

const API_BASE = "http://localhost:5217";

function LoginScreen({ onLogin }) {
    const [username, setUsername] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username.trim()) return;

        const res = await fetch(`${API_BASE}/api/users/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username }),
        });

        const user = await res.json();
        onLogin(user);
    };

    return (
        <form onSubmit={handleSubmit} style={{ padding: "2rem" }}>
            <h2>Log in to SharpChat</h2>
            <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter a username"
            />
            <button type="submit">Log in</button>
        </form>
    );
}

function ChatScreen({ me, otherUsername }) {
    const [otherUserId, setOtherUserId] = useState(null);
    const [messages, setMessages] = useState([]);
    const connectionRef = useRef(null);

    useEffect(() => {
        fetch(`${API_BASE}/api/users/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: otherUsername }),
        })
            .then((res) => res.json())
            .then((user) => setOtherUserId(user.id));
    }, [otherUsername]);

    useEffect(() => {
        if (!otherUserId) return;

        fetch(`${API_BASE}/api/messages/conversation?userA=${me.id}&userB=${otherUserId}`)
            .then((res) => res.json())
            .then((data) => setMessages(data));

        const connection = new signalR.HubConnectionBuilder()
            .withUrl(`${API_BASE}/hubs/chat`)
            .build();

        connection.on("ReceiveMessage", (message) => {
            setMessages((prev) => [...prev, message]);
        });

        connection.start().then(() => {
            connection.invoke("JoinConversation", me.id);
        });

        connectionRef.current = connection;

        return () => {
            connection.stop();
        };
    }, [otherUserId, me.id]);

    const handleSend = async (text) => {
        try {
            const res = await fetch(`${API_BASE}/api/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    senderId: me.id,
                    recipientId: otherUserId,
                    content: text,
                }),
            });

            if (!res.ok) {
                console.error("Send failed:", res.status, await res.text());
                return;
            }

            const savedMessage = await res.json();
            setMessages((prev) => [...prev, savedMessage]);
        } catch (err) {
            console.error("Send threw an error:", err);
        }
    };

    if (!otherUserId) return <p>Loading conversation...</p>;

    return (
        <div style={{ height: "100vh" }}>
            <MainContainer>
                <ChatContainer>
                    <MessageList>
                        {messages.map((m) => (
                            <Message
                                key={m.id}
                                model={{
                                    message: m.content,
                                    direction: m.senderId === me.id ? "outgoing" : "incoming",
                                    position: "single",
                                }}
                            />
                        ))}
                    </MessageList>
                    <MessageInput placeholder="Type a message" onSend={handleSend} />
                </ChatContainer>
            </MainContainer>
        </div>
    );
}

function App() {
    const [me, setMe] = useState(null);

    if (!me) {
        return <LoginScreen onLogin={setMe} />;
    }

    const otherUsername = me.username === "alice" ? "cbug" : "alice";

    return <ChatScreen me={me} otherUsername={otherUsern} />;
}

export default App;
