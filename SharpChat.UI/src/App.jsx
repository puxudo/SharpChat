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
import "./App.css";
import ContactList from "./ContactList";

const API_BASE = import.meta.env.VITE_API_URL;

const AVATAR_COLORS = ["#6a5cff", "#3ec6e0", "#ff7a7a", "#ffb84d", "#4dd68a", "#c37bff"];

function colorForName(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function Avatar({ username, size = "" }) {
    const initial = username?.[0]?.toUpperCase() ?? "?";
    return (
        <div
            className={`avatar-circle ${size}`}
            style={{ background: colorForName(username ?? "") }}
        >
            {initial}
        </div>
    );
}

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
        <div className="login-screen">
            <form onSubmit={handleSubmit} className="login-card">
                <h2>Log in to SharpChat</h2>
                <span className="login-tagline">Pick a username to start chatting</span>
                <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter a username"
                    dir="auto"
                />
                <button type="submit">Log in</button>
            </form>
        </div>
    );
}

function ChatScreen({ me, otherUser, onBack }) {
    const [messages, setMessages] = useState([]);
    const connectionRef = useRef(null);

    useEffect(() => {
        fetch(`${API_BASE}/api/messages/conversation?userA=${me.id}&userB=${otherUser.id}`)
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
    }, [otherUser.id, me.id]);

    const handleSend = async (text) => {
        try {
            const res = await fetch(`${API_BASE}/api/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    senderId: me.id,
                    recipientId: otherUser.id,
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

    return (
        <div className="chat-body">
            <div className="chat-header">
                <button className="back-btn" onClick={onBack} aria-label="Back">
                    &larr;
                </button>
                <Avatar username={otherUser.username} size="small" />
                <div>
                    <div className="chat-title">{otherUser.username}</div>
                    <div className="chat-subtitle">Active now</div>
                </div>
            </div>
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
    const [otherUser, setOtherUser] = useState(null);

    if (!me) {
        return <LoginScreen onLogin={setMe} />;
    }

    if (!otherUser) {
        return (
            <div className="app-shell">
                <ContactList me={me} onSelectContact={setOtherUser} />
            </div>
        );
    }

    return (
        <div className="app-shell">
            <ChatScreen
                me={me}
                otherUser={otherUser}
                onBack={() => setOtherUser(null)}
            />
        </div>
    );
}

export default App;
