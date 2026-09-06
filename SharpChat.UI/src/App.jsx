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
    const [mode, setMode] = useState("login"); // "login" | "register"
    const [username, setUsername] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const endpoint = mode === "login" ? "login" : "register";
        const body =
            mode === "login"
                ? { username, password }
                : { username, name, password };

        try {
            const res = await fetch(`${API_BASE}/api/users/${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const text = await res.text();
                setError(text || "Something went wrong.");
                return;
            }

            const user = await res.json();
            onLogin(user);
        } catch (err) {
            setError("Could not reach the server.");
        }
    };

    return (
        <div className="login-screen">
            <form onSubmit={handleSubmit} className="login-card">
                <h2>{mode === "login" ? "Log in to SharpChat" : "Create an account"}</h2>
                <span className="login-tagline">
                    {mode === "login" ? "Welcome back" : "Pick a username to get started"}
                </span>

                <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    dir="auto"
                />

                {mode === "register" && (
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        dir="auto"
                    />
                )}

                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                />

                {error && <p className="login-error">{error}</p>}

                <button type="submit">{mode === "login" ? "Log in" : "Register"}</button>

                <button
                    type="button"
                    className="login-switch"
                    onClick={() => {
                        setMode(mode === "login" ? "register" : "login");
                        setError("");
                    }}
                >
                    {mode === "login" ? "Need an account? Register" : "Already have an account? Log in"}
                </button>
            </form>
        </div>
    );
}

function ContextMenu({ x, y, onDelete, onClose }) {
    const ref = useRef(null);

    useEffect(() => {
        const handleOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) onClose();
        };
        window.addEventListener("mousedown", handleOutside);
        return () => {
            window.removeEventListener("mousedown", handleOutside);
        };
    }, [onClose]);

    return (
        <div ref={ref} className="context-menu" style={{ top: y, left: x }}>
            <button className="context-menu-item danger" onClick={onDelete}>
                Delete message
            </button>
        </div>
    );
}

function ChatScreen({ me, otherUser, onBack }) {
    const [messages, setMessages] = useState([]);
    const [menu, setMenu] = useState(null); // { x, y, message } | null
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

        connection.on("MessageDeleted", (id) => {
            setMessages((prev) => prev.filter((m) => m.id !== id));
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

    const handleContextMenu = (e, message) => {
        e.preventDefault();
        if (message.senderId !== me.id) return; // only allow deleting your own messages
        setMenu({ x: e.clientX, y: e.clientY, message });
    };

    const handleDelete = async () => {
        const messageId = menu.message.id;
        setMenu(null);

        try {
            const res = await fetch(`${API_BASE}/api/messages/${messageId}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                console.error("Delete failed:", res.status, await res.text());
                return;
            }

            setMessages((prev) => prev.filter((m) => m.id !== messageId));
        } catch (err) {
            console.error("Delete threw an error:", err);
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
                    <div className="chat-title">{otherUser.name || otherUser.username}</div>
                    <div className="chat-subtitle">@{otherUser.username}</div>
                </div>
            </div>
            <MainContainer>
                <ChatContainer>
                    <MessageList>
                        {messages.map((m) => (
                            <div key={m.id} onContextMenu={(e) => handleContextMenu(e, m)}>
                                <Message
                                    model={{
                                        message: m.content,
                                        direction: m.senderId === me.id ? "outgoing" : "incoming",
                                        position: "single",
                                    }}
                                />
                            </div>
                        ))}
                    </MessageList>
                    <MessageInput placeholder="Type a message" onSend={handleSend} />
                </ChatContainer>
            </MainContainer>

            {menu && (
                <ContextMenu
                    x={menu.x}
                    y={menu.y}
                    onDelete={handleDelete}
                    onClose={() => setMenu(null)}
                />
            )}
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
