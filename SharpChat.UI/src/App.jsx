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
import ProfileScreen from "./ProfileScreen";
import AppearanceScreen from "./AppearanceScreen";
import AccountScreen from "./AccountScreen";
import SplitPane from "./SplitPane";

const API_BASE = import.meta.env.VITE_API_URL;

const AVATAR_COLORS = ["#6a5cff", "#3ec6e0", "#ff7a7a", "#ffb84d", "#4dd68a", "#c37bff"];

function colorForName(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function Avatar({ username, size = "", emoji = null }) {
    const initial = username?.[0]?.toUpperCase() ?? "?";
    return (
        <div className={`avatar-circle ${size}`} style={{ background: colorForName(username ?? "") }}>
            {emoji || initial}
        </div>
    );
}

function DefaultPane({ icon, text }) {
    return (
        <div className="default-pane">
            <div className="default-pane-icon">{icon}</div>
            <p>{text}</p>
        </div>
    );
}

function LoginScreen({ onLogin }) {
    const [mode, setMode] = useState("login");
    const [username, setUsername] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const endpoint = mode === "login" ? "login" : "register";
        const body = mode === "login" ? { username, password } : { username, name, password };

        try {
            const res = await fetch(`${API_BASE}/api/users/${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                setError((await res.text()) || "Something went wrong.");
                return;
            }

            const authResponse = await res.json();
            onLogin(authResponse);
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
                <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" dir="auto" />
                {mode === "register" && (
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" dir="auto" />
                )}
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
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
        return () => window.removeEventListener("mousedown", handleOutside);
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
    const [menu, setMenu] = useState(null);
    const connectionRef = useRef(null);

    const markRead = () => {
        fetch(`${API_BASE}/api/messages/mark-read?userId=${me.id}&otherUserId=${otherUser.id}`, { method: "POST" });
    };

    useEffect(() => {
        fetch(`${API_BASE}/api/messages/conversation?userA=${me.id}&userB=${otherUser.id}`)
            .then((res) => res.json())
            .then((data) => setMessages(data));

        markRead();

        const connection = new signalR.HubConnectionBuilder().withUrl(`${API_BASE}/hubs/chat`).build();

        connection.on("ReceiveMessage", (message) => {
            const belongs =
                (message.senderId === me.id && message.recipientId === otherUser.id) ||
                (message.senderId === otherUser.id && message.recipientId === me.id);
            if (!belongs) return;

            setMessages((prev) => [...prev, message]);
            if (message.senderId === otherUser.id) markRead();
        });

        connection.on("MessageDeleted", (id) => {
            setMessages((prev) => prev.filter((m) => m.id !== id));
        });

        connection.start().then(() => connection.invoke("JoinConversation", me.id));
        connectionRef.current = connection;

        return () => connection.stop();
    }, [otherUser.id, me.id]);

    const handleSend = async (text) => {
        try {
            const res = await fetch(`${API_BASE}/api/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ senderId: me.id, recipientId: otherUser.id, content: text }),
            });
            if (!res.ok) return;
            const savedMessage = await res.json();
            setMessages((prev) => [...prev, savedMessage]);
        } catch (err) {
            console.error("Send threw an error:", err);
        }
    };

    const handleContextMenu = (e, message) => {
        e.preventDefault();
        if (message.senderId !== me.id) return;
        setMenu({ x: e.clientX, y: e.clientY, message });
    };

    const handleDelete = async () => {
        const messageId = menu.message.id;
        setMenu(null);
        const res = await fetch(`${API_BASE}/api/messages/${messageId}`, { method: "DELETE" });
        if (res.ok) setMessages((prev) => prev.filter((m) => m.id !== messageId));
    };

    return (
        <div className="chat-body">
            <div className="chat-header">
                <button className="back-btn" onClick={onBack} aria-label="Back">&larr;</button>
                <Avatar username={otherUser.username} size="small" emoji={otherUser.avatarEmoji} />
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
            {menu && <ContextMenu x={menu.x} y={menu.y} onDelete={handleDelete} onClose={() => setMenu(null)} />}
        </div>
    );
}

function ChatsTab({ me }) {
    const [otherUser, setOtherUser] = useState(null);

    return (
        <SplitPane
            hasSelection={!!otherUser}
            list={<ContactList me={me} onSelectContact={setOtherUser} activeContactId={otherUser?.id} />}
            detail={
                otherUser ? (
                    <ChatScreen me={me} otherUser={otherUser} onBack={() => setOtherUser(null)} />
                ) : (
                    <DefaultPane icon="💬" text="Select a chat to start messaging" />
                )
            }
        />
    );
}

function SettingsTab({ me, onUpdate, onLogout }) {
    const [activeOption, setActiveOption] = useState(null);

    const options = [
        { key: "profile", label: "Profile", icon: "👤" },
        { key: "appearance", label: "Appearance", icon: "🎨" },
        { key: "account", label: "Account", icon: "🚪" },
    ];

    return (
        <SplitPane
            hasSelection={!!activeOption}
            list={
                <div className="settings-list">
                    <div className="contact-list-header">
                        <h2>Settings</h2>
                    </div>
                    {options.map((opt) => (
                        <button
                            key={opt.key}
                            className={`contact-row ${activeOption === opt.key ? "active-row" : ""}`}
                            onClick={() => setActiveOption(opt.key)}
                        >
                            <div className="avatar-circle">{opt.icon}</div>
                            <div className="contact-name">{opt.label}</div>
                        </button>
                    ))}
                </div>
            }
            detail={
                activeOption === "profile" ? (
                    <ProfileScreen me={me} onUpdate={onUpdate} onBack={() => setActiveOption(null)} />
                ) : activeOption === "appearance" ? (
                    <AppearanceScreen onBack={() => setActiveOption(null)} />
                ) : activeOption === "account" ? (
                    <AccountScreen onLogout={onLogout} onBack={() => setActiveOption(null)} />
                ) : (
                    <DefaultPane icon="⚙️" text="Choose a setting to configure it" />
                )
            }
        />
    );
}

function BottomNav({ active, onChange }) {
    const tabs = [
        { key: "chats", label: "Chats", icon: "💬" },
        { key: "settings", label: "Settings", icon: "⚙️" },
    ];

    return (
        <nav className="bottom-nav">
            {tabs.map((tab) => (
                <button
                    key={tab.key}
                    className={`nav-tab ${active === tab.key ? "active" : ""}`}
                    onClick={() => onChange(tab.key)}
                >
                    <span className="nav-icon">{tab.icon}</span>
                    <span className="nav-label">{tab.label}</span>
                </button>
            ))}
        </nav>
    );
}

function App() {
    const [me, setMe] = useState(null);
    const [checkingSession, setCheckingSession] = useState(true);
    const [activeTab, setActiveTab] = useState("chats");

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme") || "dark";
        document.documentElement.setAttribute("data-theme", savedTheme);
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            setCheckingSession(false);
            return;
        }

        fetch(`${API_BASE}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => {
                if (!res.ok) throw new Error("Invalid session");
                return res.json();
            })
            .then((user) => setMe(user))
            .catch(() => localStorage.removeItem("token"))
            .finally(() => setCheckingSession(false));
    }, []);

    const handleLogin = (authResponse) => {
        localStorage.setItem("token", authResponse.token);
        setMe(authResponse.user);
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        setMe(null);
        setActiveTab("chats");
    };

    if (checkingSession) return <p style={{ padding: "2rem" }}>Loading...</p>;
    if (!me) return <LoginScreen onLogin={handleLogin} />;

    return (
        <div className="app-shell">
            <div className="tab-content">
                {activeTab === "chats" && <ChatsTab me={me} />}
                {activeTab === "settings" && (
                    <SettingsTab me={me} onUpdate={setMe} onLogout={handleLogout} />
                )}
            </div>
            <BottomNav active={activeTab} onChange={setActiveTab} />
        </div>
    );
}

export default App;
