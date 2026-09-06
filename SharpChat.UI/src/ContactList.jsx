import { useEffect, useState } from "react";

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

    useEffect(() => {
        fetch(`${API_BASE}/api/messages/contacts/${me.id}`)
            .then((res) => res.json())
            .then(async (contactIds) => {
                const users = await Promise.all(
                    contactIds.map((id) =>
                        fetch(`${API_BASE}/api/users/${id}`).then((res) => res.json())
                    )
                );
                setContacts(users);
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

    const listToShow = searchTerm.trim() ? searchResults : contacts;

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

            {loading && !searchTerm && <p className="empty-state">Loading contacts...</p>}
            {!loading && listToShow.length === 0 && (
                <p className="empty-state">
                    {searchTerm ? "No users found." : "No contacts yet — search a username to start a chat."}
                </p>
            )}

            {listToShow.map((user) => (
                <button key={user.id} className="contact-row" onClick={() => onSelectContact(user)}>
                    <div className="avatar-circle" style={{ background: colorForName(user.username) }}>
                        {user.username?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                        <div className="contact-name">{user.name || user.username}</div>
                        <div className="contact-sub">@{user.username}</div>
                    </div>
                </button>
            ))}
        </div>
    );
}
