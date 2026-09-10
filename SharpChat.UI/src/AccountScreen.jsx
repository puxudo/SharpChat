// AccountScreen.jsx
import { IconArrowLeft } from "./Icons";

export default function AccountScreen({ onLogout, onBack }) {
    return (
        <div className="settings-panel">
            <div className="panel-header">
                <button className="icon-btn" onClick={onBack} aria-label="Back"><IconArrowLeft width={20} height={20} /></button>
                <div className="panel-title">Account</div>
            </div>
            <div className="settings-panel-body">
                <button className="danger-btn" onClick={onLogout}>Log out</button>
            </div>
        </div>
    );
}
