import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL;

const EMOJI_OPTIONS = ["😀", "😎", "🦊", "🐱", "🐶", "🐼", "🦁", "🐸", "🐙", "🌟", "🔥", "⚡"];

export default function ProfileScreen({ me, onUpdate }) {
    const [name, setName] = useState(me.name);
    const [avatarEmoji, setAvatarEmoji] = useState(me.avatarEmoji);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);

        try {
            const res = await fetch(`${API_BASE}/api/users/${me.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, avatarEmoji }),
            });

            if (res.ok) {
                onUpdate({ ...me, name, avatarEmoji });
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="profile-screen">
            <h2>Profile</h2>

            <div className="profile-avatar-preview">
                {avatarEmoji ? (
                    <span className="avatar-emoji-large">{avatarEmoji}</span>
                ) : (
                    <span className="avatar-emoji-large">{me.username?.[0]?.toUpperCase()}</span>
                )}
            </div>

            <div className="profile-field">
                <label>Username</label>
                <input value={me.username} disabled dir="auto" />
            </div>

            <div className="profile-field">
                <label>Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} dir="auto" />
            </div>

            <div className="profile-field">
                <label>Avatar</label>
                <div className="emoji-grid">
                    {EMOJI_OPTIONS.map((emoji) => (
                        <button
                            key={emoji}
                            className={`emoji-option ${avatarEmoji === emoji ? "selected" : ""}`}
                            onClick={() => setAvatarEmoji(emoji)}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </div>

            <button className="profile-save-btn" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : saved ? "Saved ✓" : "Save changes"}
            </button>
        </div>
    );
}
