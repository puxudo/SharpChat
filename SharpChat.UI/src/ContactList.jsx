import { useEffect, useState } from "react";
import { IconSearch } from "./Icons";

const API_BASE = import.meta.env.VITE_API_URL;
const AVATAR_COLORS = ["#7c6cf0", "#3ec6c2", "#e0824f", "#5eb87a", "#e0577a", "#4f9fe0"];

function colorForName(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function ContactList({ me, onSelectContact, activeContactId }) {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);

    useEffect(() => {
        fetch(`${API_BASE}/api/messages/contacts/${me.id}`)
            .then((res) => res.json())
            .then((data) => {
                setContacts(data);
                setLoading(false);
            });
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
            <div className="panel-list-header">
                <h2>Chats</h2>
                <div className="search-box">
                    <IconSearch width={16} height={16} />
                    <input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search"
                        dir="auto"
                    />
                </div>
            </div>

            {isSearching ? (
                <>
                    {searchResults.length === 0 && <p className="empty-state">No users found.</p>}
                    {searchResults.map((user) => (
                        <button
                            key={user.id}
                            className="contact-row"
                            onClick={() =>
                                onSelectContact({ id: user.id, username: user.username, name: user.name, avatarEmoji: user.avatarEmoji })
                            }
                        >
                            <div className="avatar-circle" style={{ background: colorForName(user.username) }}>
                                {user.avatarEmoji || user.username?.[0]?.toUpperCase() || "?"}
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
                    {loading && <p className="empty-state">Loading…</p>}
                    {!loading && contacts.length === 0 && (
                        <p className="empty-state">No conversations yet. Search a username to start one.</p>
                    )}
                    {contacts.map((c) => (
                        <button
                            key={c.userId}
                            className={`contact-row ${c.userId === activeContactId ? "active-row" : ""}`}
                            onClick={() =>
                                onSelectContact({ id: c.userId, username: c.username, name: c.name, avatarEmoji: c.avatarEmoji })
                            }
                        >
                            <div className="avatar-circle" style={{ background: colorForName(c.username) }}>
                                {c.avatarEmoji || c.username?.[0]?.toUpperCase() || "?"}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="contact-name">{c.name || c.username}</div>
                                <div className="contact-sub contact-preview">{c.lastMessage}</div>
                            </div>
                            {c.unreadCount > 0 && (
                                <div className="unread-badge">{c.unreadCount > 9 ? "9+" : c.unreadCount}</div>
                            )}
                        </button>
                    ))}
                </>
            )}
        </div>
    );
}
