import { useEffect, useState } from "react";

export default function AppearanceScreen({ onBack }) {
    const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    return (
        <div className="settings-panel">
            <div className="chat-header">
                <button className="back-btn" onClick={onBack} aria-label="Back">&larr;</button>
                <div className="chat-title">Appearance</div>
            </div>
            <div className="settings-panel-body">
                <div className="theme-row">
                    <span>Dark mode</span>
                    <button
                        className={`theme-toggle ${theme === "dark" ? "on" : ""}`}
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    >
                        <span className="theme-toggle-knob" />
                    </button>
                </div>
            </div>
        </div>
    );
}
