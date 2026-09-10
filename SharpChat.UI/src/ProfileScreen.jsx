import { useState } from "react";
import { IconArrowLeft } from "./Icons";

const API_BASE = import.meta.env.VITE_API_URL;
const EMOJI_OPTIONS = ["😀", "😎", "🦊", "🐱", "🐶", "🐼", "🦁", "🐸", "🐙", "🌟", "🔥", "⚡"];

export default function ProfileScreen({ me, onUpdate, onBack }) {
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
        <div className="settings-panel">
            <div className="panel-header">
                <button className="icon-btn" onClick={onBack} aria-label="Back"><IconArrowLeft width={20} height={20} /></button>
                <div className="panel-title">Profile</div>
            </div>

            <div className="settings-panel-body">
                <div className="profile-avatar-preview">
                    <span className="avatar-emoji-large">{avatarEmoji || me.username?.[0]?.toUpperCase()}</span>
                </div>

                <div className="field">
                    <label>Username</label>
                    <input value={me.username} disabled dir="auto" />
                </div>

                <div className="field">
                    <label>Name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} dir="auto" />
                </div>

                <div className="field">
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

                <button className="primary-btn" onClick={handleSave} disabled={saving}>
                    {saving ? "Saving…" : saved ? "Saved" : "Save changes"}
                </button>
            </div>
        </div>
    );
}
