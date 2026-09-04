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

    useEffect(() => {
        fetch(`${API_BASE}/api/users`)
            .then((res) => res.json())
            .then((users) => {
                setContacts(users.filter((u) => u.id !== me.id));
                setLoading(false);
            });
    }, [me.id]);

    return (
        <div className="contact-list">
            <div className="contact-list-header">
                <h2>Chats</h2>
            </div>

            {loading && <p className="empty-state">Loading contacts...</p>}
            {!loading && contacts.length === 0 && (
                <p className="empty-state">No other users yet. Log in as someone else to see them here.</p>
            )}

            {contacts.map((user) => (
                <button key={user.id} className="contact-row" onClick={() => onSelectContact(user)}>
                    <div className="avatar-circle" style={{ background: colorForName(user.username) }}>
                        {user.username?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                        <div className="contact-name">{user.username}</div>
                        <div className="contact-sub">Tap to open chat</div>
                    </div>
                </button>
            ))}
        </div>
    );
}
