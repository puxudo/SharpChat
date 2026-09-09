export default function AccountScreen({ onLogout, onBack }) {
    return (
        <div className="settings-panel">
            <div className="chat-header">
                <button className="back-btn" onClick={onBack} aria-label="Back">&larr;</button>
                <div className="chat-title">Account</div>
            </div>
            <div className="settings-panel-body">
                <button className="logout-btn" onClick={onLogout}>Log out</button>
            </div>
        </div>
    );
}
