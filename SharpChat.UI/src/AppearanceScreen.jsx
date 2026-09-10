import { useEffect, useState } from "react";
import { IconArrowLeft } from "./Icons";

export default function AppearanceScreen({ onBack }) {
    const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    return (
        <div className="settings-panel">
            <div className="panel-header">
                <button className="icon-btn" onClick={onBack} aria-label="Back"><IconArrowLeft width={20} height={20} /></button>
                <div className="panel-title">Appearance</div>
            </div>
            <div className="settings-panel-body">
                <div className="toggle-row">
                    <span>Dark mode</span>
                    <button
                        className={`switch ${theme === "dark" ? "on" : ""}`}
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    >
                        <span className="switch-knob" />
                    </button>
                </div>
            </div>
        </div>
    );
}
