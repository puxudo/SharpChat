import { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";

const API_BASE = import.meta.env.VITE_API_URL;

const AVATAR_COLORS = ["#6a5cff", "#3ec6e0", "#ff7a7a", "#ffb84d", "#4dd68a", "#c37bff"];

function colorForName(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function ContactList({ me, onSelectContact }) {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const connectionRef = useRef(null);

    const loadContacts = () => {
        fetch(`${API_BASE}/api/messages/contacts/${me.id}`)
            .then((res) => res.json())
            .then((data) => {
                setContacts(data);
                setLoading(false);
            });
    };

    useEffect(() => {
        loadContacts();

        const connection = new signalR.HubConnectionBuilder()
            .withUrl(`${API_BASE}/hubs/chat`)
            .build();

        connection.on("ReceiveMessage", (message) => {
            if (message.recipientId !== me.id) return;

            setContacts((prev) => {
                const existing = prev.find((c) => c.userId === message.senderId);

                if (!existing) {
                    loadContacts();
                    return prev;
                }

                const updated = prev.map((c) =>
                    c.userId === message.senderId
                        ? {
                            ...c,
                            lastMessage: message.content,
                            lastMessageAt: message.sentAt,
                            unreadCount: c.unreadCount + 1,
                        }
                        : c
                );

                return updated.sort(
                    (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
                );
            });
        });

        connection.start().then(() => {
            connection.invoke("JoinConversation", me.id);
        });

        connectionRef.current = connection;

        return () => {
            connection.stop();
        };
    }, [me.id]);

    useEffect(() => {
        if (!searchTerm.trim()) {
            setSearchResults([]);
            return;
        }

        const timeout = setTimeout(() => {
            fetch(`${API_BASE}/api/users/search?username=${encodeURIComponent(searchTerm)}`)
                .then((res) => res.json())
                .then((users) => setSearchResults(users.filter((u) => u.id !== me.id)));
        }, 300);

        return () => clearTimeout(timeout);
    }, [searchTerm, me.id]);

    const isSearching = searchTerm.trim().length > 0;

    return (
        <div className="contact-list">
            <div className="contact-list-header">
                <h2>Chats</h2>
                <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by username..."
                    dir="auto"
                    style={{ marginTop: "0.75rem", width: "100%" }}
                />
            </div>

            {isSearching ? (
                <>
                    {searchResults.length === 0 && <p className="empty-state">No users found.</p>}
                    {searchResults.map((user) => (
                        <button
                            key={user.id}
                            className="contact-row"
                            onClick={() =>
                                onSelectContact({ id: user.id, username: user.username, name: user.name })
                            }
                        >
                            <div
                                className="avatar-circle"
                                style={{ background: colorForName(user.username) }}
                            >
                                {user.username?.[0]?.toUpperCase() ?? "?"}
                            </div>
                            <div>
                                <div className="contact-name">{user.name || user.username}</div>
                                <div className="contact-sub">@{user.username}</div>
                            </div>
                        </button>
                    ))}
                </>
            ) : (
                <>
                    {loading && <p className="empty-state">Loading contacts...</p>}
                    {!loading && contacts.length === 0 && (
                        <p className="empty-state">No contacts yet — search a username to start a chat.</p>
                    )}
                    {contacts.map((c) => (
                        <button
                            key={c.userId}
                            className="contact-row"
                            onClick={() =>
                                onSelectContact({ id: c.userId, username: c.username, name: c.name })
                            }
                        >
                            <div
                                className="avatar-circle"
                                style={{ background: colorForName(c.username) }}
                            >
                                {c.username?.[0]?.toUpperCase() ?? "?"}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="contact-name">{c.name || c.username}</div>
                                <div className="contact-sub contact-preview">{c.lastMessage}</div>
                            </div>
                            {c.unreadCount > 0 && (
                                <div className="unread-badge">
                                    {c.unreadCount > 9 ? "9+" : c.unreadCount}
                                </div>
                            )}
                        </button>
                    ))}
                </>
            )}
        </div>
    );
}
